'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import PoliticsArticleReader from '@/src/views/PoliticsArticleReader.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><PoliticsArticleReader /></MainLayout></ProtectedRoute>;
}
