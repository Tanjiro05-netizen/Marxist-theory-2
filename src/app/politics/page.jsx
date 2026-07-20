'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import PoliticsPage from '@/src/views/PoliticsPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><PoliticsPage /></MainLayout></ProtectedRoute>;
}
