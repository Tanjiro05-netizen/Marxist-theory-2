import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

jest.mock('../supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            refreshSession: jest.fn(),
            onAuthStateChange: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            signUp: jest.fn(),
        },
        from: jest.fn(),
        rpc: jest.fn(),
    },
}));

const makeProfileQuery = (profile) => {
    const query = {
        select: jest.fn(() => query),
        eq: jest.fn(() => query),
        maybeSingle: jest.fn(() => Promise.resolve(profile).then((data) => ({ data, error: null }))),
    };
    return query;
};

const AuthProbe = () => {
    const { loading, profile, user } = useAuth();

    return (
        <div>
            <span data-testid="loading">{String(loading)}</span>
            <span data-testid="user-id">{user?.id || 'none'}</span>
            <span data-testid="profile-id">{profile?.id || 'none'}</span>
        </div>
    );
};

const LoginProbe = () => {
    const { login } = useAuth();
    const [status, setStatus] = React.useState('idle');

    const handleLogin = async () => {
        setStatus('pending');
        await login({ email: 'Test@Example.com', password: 'password' });
        setStatus('done');
    };

    return (
        <div>
            <button onClick={handleLogin}>Login</button>
            <span data-testid="login-status">{status}</span>
        </div>
    );
};

describe('AuthProvider session resume', () => {
    const initialUser = { id: 'user-initial', email: 'initial@example.test' };
    const refreshedUser = { id: 'user-refreshed', email: 'refreshed@example.test' };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        supabase.auth.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: jest.fn() } },
        });
        supabase.from.mockImplementation((tableName) => {
            if (tableName !== 'profiles') throw new Error(`Unexpected table: ${tableName}`);
            return makeProfileQuery({ id: 'profile-current', username: 'Current' });
        });
    });

    test('refreshes the Supabase session when a hidden page becomes visible again', async () => {
        supabase.auth.getSession.mockResolvedValue({
            data: { session: { user: initialUser } },
            error: null,
        });
        supabase.auth.refreshSession.mockResolvedValue({
            data: { session: { user: refreshedUser } },
            error: null,
        });

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
            expect(screen.getByTestId('user-id')).toHaveTextContent(initialUser.id);
        });

        await act(async () => {
            document.dispatchEvent(new Event('visibilitychange'));
        });

        await waitFor(() => {
            expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
            expect(screen.getByTestId('user-id')).toHaveTextContent(refreshedUser.id);
        });
    });

    test('does not block a successful login on profile loading', async () => {
        let resolveProfile;
        const profilePromise = new Promise((resolve) => {
            resolveProfile = resolve;
        });

        supabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: null,
        });
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { user: refreshedUser, session: { user: refreshedUser } },
            error: null,
        });
        supabase.from.mockImplementation((tableName) => {
            if (tableName !== 'profiles') throw new Error(`Unexpected table: ${tableName}`);
            return makeProfileQuery(profilePromise);
        });

        render(
            <AuthProvider>
                <LoginProbe />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(supabase.auth.getSession).toHaveBeenCalled();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(screen.getByTestId('login-status')).toHaveTextContent('done');
        });

        await act(async () => {
            resolveProfile({ id: 'profile-after-login', username: 'Loaded later' });
            await profilePromise;
        });
    });
});
