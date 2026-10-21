import React from 'react';
import RedirectTo from './RedirectTo.jsx';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">Checking permissions...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <RedirectTo href="/login" replace />;
    }
    
    if (!isAdmin()) {
        return <RedirectTo href="/coming-soon" replace />;
    }

    return children;
};

export default AdminRoute;
