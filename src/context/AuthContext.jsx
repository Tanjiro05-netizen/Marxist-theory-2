import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
    canProfileManagePolitics,
    canProfileManageStudy,
    DEV_ADMIN_PASSWORD,
    DEV_ADMIN_PROFILE,
    DEV_ADMIN_USER,
    DEV_AUTH_COOKIE_KEY,
    DEV_AUTH_STORAGE_KEY,
    hasEditorialRoleInProfile,
    isAdminProfile,
    isAdminUser,
    isLocalDevelopmentHost,
} from '../lib/auth.js';

export {
    canProfileManagePolitics,
    canProfileManageStudy,
    hasEditorialRoleInProfile,
    isAdminProfile,
    isAdminUser,
    isLocalDevelopmentHost,
} from '../lib/auth.js';

const AuthContext = createContext();
const LOGIN_TIMEOUT_MS = 30000;
const SESSION_TIMEOUT_MS = 20000;
const SESSION_RETRY_DELAY_MS = 1200;
const RESUME_SESSION_SYNC_MIN_INTERVAL_MS = 5000;

export const AUTH_TIMEOUT_MESSAGE = 'Connection is slow — Supabase may be waking up. Please try again in a few seconds.';

const hasLocalDevAuth = () =>
    isLocalDevelopmentHost() &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(DEV_AUTH_STORAGE_KEY);

const withTimeout = async (promise, ms, timeoutMessage) => {
    let timeoutId;

    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), ms);
            }),
        ]);
    } finally {
        clearTimeout(timeoutId);
    }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchRoleFallbackProfile = async (userId) => {
    if (!userId) return null;

    try {
        const { data: role, error } = await supabase.rpc('get_user_role');
        if (error || !role) return null;
        return { id: userId, role };
    } catch (error) {
        console.warn('Profile role fallback failed:', error);
        return null;
    }
};

const getSessionWithRetry = async () => {
    const getSessionOnce = () =>
        withTimeout(
            supabase.auth.getSession(),
            SESSION_TIMEOUT_MS,
            'Auth session check timed out.'
        );

    try {
        return await getSessionOnce();
    } catch (firstError) {
        await delay(SESSION_RETRY_DELAY_MS);
        try {
            return await getSessionOnce();
        } catch (finalError) {
            finalError.cause = firstError;
            throw finalError;
        }
    }
};

const refreshSessionWithFallback = async () => {
    let refreshError;

    try {
        const response = await withTimeout(
            supabase.auth.refreshSession(),
            SESSION_TIMEOUT_MS,
            'Auth session refresh timed out.'
        );
        if (!response?.error) return response;
        refreshError = response.error;
    } catch (error) {
        refreshError = error;
    }

    try {
        return await getSessionWithRetry();
    } catch (fallbackError) {
        fallbackError.cause = refreshError;
        throw fallbackError;
    }
};

export const AuthProvider = ({ children, initialUser = null, initialProfile = null, initialAuthResolved = false }) => {
    const [user, setUser] = useState(initialUser);
    const [profile, setProfile] = useState(initialProfile);
    const [loading, setLoading] = useState(!initialAuthResolved);
    const latestUserRef = useRef(initialUser);
    const lastResumeSessionSyncAtRef = useRef(0);
    const resumeSessionSyncPromiseRef = useRef(null);

    useEffect(() => {
        latestUserRef.current = user;
    }, [user]);

    const applyLocalDevAuth = useCallback(() => {
        setUser(DEV_ADMIN_USER);
        setProfile(DEV_ADMIN_PROFILE);
        setLoading(false);
    }, []);

    const fetchProfile = useCallback(async (userId) => {
        if (!userId) {
            setProfile(null);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }
            setProfile(data || await fetchRoleFallbackProfile(userId));
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile(await fetchRoleFallbackProfile(userId));
        }
    }, []);

    const syncSession = useCallback(async ({ refresh = false, clearOnFailure = true } = {}) => {
        if (hasLocalDevAuth()) {
            applyLocalDevAuth();
            return;
        }

        const shouldRefreshExistingSession = refresh && !!latestUserRef.current;

        try {
            const response = shouldRefreshExistingSession
                ? await refreshSessionWithFallback()
                : await getSessionWithRetry();
            const session = response?.data?.session ?? null;

            if (response?.error) {
                throw response.error;
            }

            setUser(session?.user ?? null);
            if (session?.user) {
                await withTimeout(fetchProfile(session.user.id), SESSION_TIMEOUT_MS, 'Profile loading timed out.');
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.warn('Auth session unavailable; continuing with the current session state.', error);
            if (clearOnFailure) {
                setUser(null);
                setProfile(null);
            }
        } finally {
            setLoading(false);
        }
    }, [applyLocalDevAuth, fetchProfile]);

    useEffect(() => {
        syncSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Respect dev auth if present
            if (hasLocalDevAuth()) {
                applyLocalDevAuth();
                return;
            }
            setUser(session?.user ?? null);
            if (session?.user) {
                setTimeout(() => {
                    fetchProfile(session.user.id);
                }, 0);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        const handleResume = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

            const now = Date.now();
            if (now - lastResumeSessionSyncAtRef.current < RESUME_SESSION_SYNC_MIN_INTERVAL_MS) return;
            if (resumeSessionSyncPromiseRef.current) return;

            lastResumeSessionSyncAtRef.current = now;
            resumeSessionSyncPromiseRef.current = syncSession({ refresh: true, clearOnFailure: false })
                .finally(() => {
                    resumeSessionSyncPromiseRef.current = null;
                });
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleResume();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleResume);
        window.addEventListener('pageshow', handleResume);
        window.addEventListener('online', handleResume);

        return () => {
            subscription?.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleResume);
            window.removeEventListener('pageshow', handleResume);
            window.removeEventListener('online', handleResume);
        };
    }, [applyLocalDevAuth, fetchProfile, syncSession]);

    const isAdmin = () => {
        if (hasLocalDevAuth()) {
            return true;
        }
        return isAdminProfile(profile) || isAdminUser(user);
    };

    const hasEditorialRole = (roleName) => {
        return hasEditorialRoleInProfile(profile, roleName);
    };

    const canManagePolitics = () => {
        if (hasLocalDevAuth()) {
            return true;
        }
        return canProfileManagePolitics(profile) || isAdminUser(user);
    };

    const canManageStudy = () => {
        if (hasLocalDevAuth()) {
            return true;
        }
        return canProfileManageStudy(profile) || isAdminUser(user);
    };

    const value = {
        signUp: ({ email, password, username, inviteCode, betaReason }) => supabase.auth.signUp({
            email,
            password,
            options: { data: { user_name: username, invite_code: inviteCode, beta_reason: betaReason } }
        }),
        login: async (data) => {
            const credentials = {
                email: `${data.email || ''}`.trim().toLowerCase(),
                password: data.password || '',
            };

            if (
                isLocalDevelopmentHost() &&
                credentials.email === DEV_ADMIN_USER.email &&
                credentials.password === DEV_ADMIN_PASSWORD
            ) {
                localStorage.setItem(DEV_AUTH_STORAGE_KEY, 'true');
                document.cookie = `${DEV_AUTH_COOKIE_KEY}=true; path=/; SameSite=Lax`;
                setUser(DEV_ADMIN_USER);
                setProfile(DEV_ADMIN_PROFILE);
                return { error: null };
            }

            const result = await withTimeout(
                supabase.auth.signInWithPassword(credentials),
                LOGIN_TIMEOUT_MS,
                AUTH_TIMEOUT_MESSAGE
            );

            if (result.data?.user) {
                setUser(result.data.user);
                withTimeout(fetchProfile(result.data.user.id), SESSION_TIMEOUT_MS, 'Profile loading timed out.')
                    .catch((error) => console.error('Error fetching profile after login:', error));
            }

            return result;
        },
        logout: async () => {
            if (isLocalDevelopmentHost()) {
                localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
                document.cookie = `${DEV_AUTH_COOKIE_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
            }
            setUser(null);
            setProfile(null);
            // Clear the retired service-worker API cache for users who already have it installed.
            if ('caches' in window) {
                caches.delete('api-cache').catch(() => {});
            }
            return supabase.auth.signOut();
        },
        user,
        profile,
        loading,
        isAdmin,
        hasEditorialRole,
        canManagePolitics,
        canManageStudy,
        refreshProfile: () => fetchProfile(latestUserRef.current?.id),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
