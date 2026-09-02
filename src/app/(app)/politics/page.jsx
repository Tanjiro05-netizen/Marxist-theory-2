'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import PoliticsPage from '@/src/views/PoliticsPage.jsx';

export default function Page() {
  return <ProtectedRoute><PoliticsPage /></ProtectedRoute>;
}
