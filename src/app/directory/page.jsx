'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import DirectoryPage from '@/src/views/DirectoryPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><DirectoryPage /></MainLayout></ProtectedRoute>;
}
