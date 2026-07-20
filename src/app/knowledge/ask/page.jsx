'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import KnowledgeAskPage from '@/src/views/KnowledgeAskPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><KnowledgeAskPage /></MainLayout></ProtectedRoute>;
}
