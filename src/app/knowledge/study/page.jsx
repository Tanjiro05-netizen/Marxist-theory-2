'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import KnowledgeStudyPage from '@/src/views/KnowledgeStudyPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><KnowledgeStudyPage /></MainLayout></ProtectedRoute>;
}
