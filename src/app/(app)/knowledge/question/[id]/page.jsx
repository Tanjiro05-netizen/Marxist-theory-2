'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import KnowledgeQuestionPage from '@/src/views/KnowledgeQuestionPage.jsx';

export default function Page() {
  return <ProtectedRoute><KnowledgeQuestionPage /></ProtectedRoute>;
}
