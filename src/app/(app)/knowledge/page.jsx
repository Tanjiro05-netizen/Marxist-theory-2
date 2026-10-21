'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import KnowledgePage from '@/src/views/KnowledgePage.jsx';

export default function Page() {
  return <ProtectedRoute><KnowledgePage /></ProtectedRoute>;
}
