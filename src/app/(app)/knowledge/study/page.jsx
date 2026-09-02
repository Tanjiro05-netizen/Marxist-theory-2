'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import KnowledgeStudyPage from '@/src/views/KnowledgeStudyPage.jsx';

export default function Page() {
  return <ProtectedRoute><KnowledgeStudyPage /></ProtectedRoute>;
}
