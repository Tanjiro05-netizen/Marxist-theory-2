'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import AnalysisPage from '@/src/views/AnalysisPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><AnalysisPage /></MainLayout></ProtectedRoute>;
}
