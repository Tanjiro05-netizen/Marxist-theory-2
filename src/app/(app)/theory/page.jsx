'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import TheoryPage from '@/src/views/TheoryPage.jsx';

export default function Page() {
  return <ProtectedRoute><TheoryPage /></ProtectedRoute>;
}
