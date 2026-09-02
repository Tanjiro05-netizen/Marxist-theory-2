import React from 'react';
import RedirectTo from './RedirectTo.jsx';
import { useAuth } from '../context/AuthContext';

/**
 * Route gate for member pages. Auth and invite access are already enforced
 * server-side by the middleware (which redirects to /login and
 * /pending-access), so the client renders content as soon as the session is
 * known. The invite check below still runs in the background — once the
 * profile settles it redirects anyone who slipped through a stale
 * middleware profile cache.
 */
const ProtectedRoute = ({ children }) => {
    const { user, profile, loading, profileReady, isAdmin } = useAuth();

    if (!user) {
        if (loading) {
            return (
                <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-400 text-sm">Loading...</span>
                    </div>
                </div>
            );
        }
        return <RedirectTo href="/login" replace />;
    }

    // Background invite guard (profile may still be in flight — content is
    // already visible; the middleware is the primary enforcement).
    if (profileReady && !isAdmin() && !profile?.has_invite_access) {
        return <RedirectTo href="/pending-access" replace />;
    }

    return children;
};

export default ProtectedRoute;
