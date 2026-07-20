'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import KnowledgeQuestionPage from '@/src/views/KnowledgeQuestionPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><KnowledgeQuestionPage /></MainLayout></ProtectedRoute>;
}
