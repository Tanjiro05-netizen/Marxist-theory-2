'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import ProfilePage from '@/src/views/ProfilePage.jsx';

export default function Page() {
  return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
}
