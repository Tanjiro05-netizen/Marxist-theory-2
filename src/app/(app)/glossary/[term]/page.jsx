'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import GlossaryTermPage from '@/src/views/GlossaryTermPage.jsx';

export default function Page() {
  return <ProtectedRoute><GlossaryTermPage /></ProtectedRoute>;
}
