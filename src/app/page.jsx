'use client';

import React, { useEffect, useState } from 'react';
import RedirectTo from '@/src/components/RedirectTo.jsx';
import { useAuth } from '@/src/context/AuthContext';

export default function Page() {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // If auth hangs, stop blocking after 3 seconds
  useEffect(() => {
    if (!loading) return;
    const id = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(id);
  }, [loading]);

  // Wait for auth to resolve before deciding
  if (loading && !timedOut) {
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

  return <RedirectTo href="/home" replace />;
}
