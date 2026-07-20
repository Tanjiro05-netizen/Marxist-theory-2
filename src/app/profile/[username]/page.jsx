'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import PublicProfilePage from '@/src/views/PublicProfilePage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><PublicProfilePage /></MainLayout></ProtectedRoute>;
}
