'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import ProfilePage from '@/src/views/ProfilePage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>;
}
