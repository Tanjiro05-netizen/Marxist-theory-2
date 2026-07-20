'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import KnowledgePage from '@/src/views/KnowledgePage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><KnowledgePage /></MainLayout></ProtectedRoute>;
}
