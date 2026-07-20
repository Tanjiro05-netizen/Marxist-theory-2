'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import AnalysisReader from '@/src/components/Analysis/AnalysisReader/AnalysisReader.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><AnalysisReader /></MainLayout></ProtectedRoute>;
}
