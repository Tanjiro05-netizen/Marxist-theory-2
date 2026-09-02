'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import PublicProfilePage from '@/src/views/PublicProfilePage.jsx';

export default function Page() {
  return <ProtectedRoute><PublicProfilePage /></ProtectedRoute>;
}
