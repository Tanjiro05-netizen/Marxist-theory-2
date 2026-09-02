'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import AnalysisPage from '@/src/views/AnalysisPage.jsx';

export default function Page() {
  return <ProtectedRoute><AnalysisPage /></ProtectedRoute>;
}
