'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import ArticleReaderPage from '@/src/views/ArticleReaderPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><ArticleReaderPage /></MainLayout></ProtectedRoute>;
}
