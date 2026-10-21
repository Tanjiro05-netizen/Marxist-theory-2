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

  // Known session → redirect immediately; don't wait for the profile fetch
  // (which is part of `loading`) to finish.
  if (user) {
    return <RedirectTo href="/home" replace />;
  }

  // Wait for auth to resolve before deciding
  if (loading && !timedOut) {
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
