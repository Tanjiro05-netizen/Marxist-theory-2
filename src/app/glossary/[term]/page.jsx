'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import GlossaryTermPage from '@/src/views/GlossaryTermPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><GlossaryTermPage /></MainLayout></ProtectedRoute>;
}
