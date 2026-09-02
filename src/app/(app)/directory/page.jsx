'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import DirectoryPage from '@/src/views/DirectoryPage.jsx';

export default function Page() {
  return <ProtectedRoute><DirectoryPage /></ProtectedRoute>;
}
