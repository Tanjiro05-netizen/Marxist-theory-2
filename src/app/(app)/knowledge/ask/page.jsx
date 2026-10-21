'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import KnowledgeAskPage from '@/src/views/KnowledgeAskPage.jsx';

export default function Page() {
  return <ProtectedRoute><KnowledgeAskPage /></ProtectedRoute>;
}
