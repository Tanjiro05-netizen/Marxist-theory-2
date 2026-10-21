'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import ScienceTechPage from '@/src/views/ScienceTechPage.jsx';

export default function Page() {
  return <ProtectedRoute><ScienceTechPage /></ProtectedRoute>;
}
