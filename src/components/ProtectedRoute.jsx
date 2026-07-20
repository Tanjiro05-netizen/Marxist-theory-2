import React from 'react';
import RedirectTo from './RedirectTo.jsx';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, profile, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#12131A] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <RedirectTo href="/login" replace />;
    }

    // Admins always have access
    if (isAdmin()) {
        return children;
    }

    // Check invite access
    if (!profile?.has_invite_access) {
        return <RedirectTo href="/pending-access" replace />;
    }

    return children;
};

export default ProtectedRoute;
