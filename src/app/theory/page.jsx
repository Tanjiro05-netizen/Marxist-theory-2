'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import TheoryPage from '@/src/views/TheoryPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><TheoryPage /></MainLayout></ProtectedRoute>;
}
