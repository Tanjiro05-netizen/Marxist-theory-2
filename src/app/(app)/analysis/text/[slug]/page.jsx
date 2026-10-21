'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import AnalysisReader from '@/src/components/Analysis/AnalysisReader/AnalysisReader.jsx';

export default function Page() {
  return <ProtectedRoute><AnalysisReader /></ProtectedRoute>;
}
