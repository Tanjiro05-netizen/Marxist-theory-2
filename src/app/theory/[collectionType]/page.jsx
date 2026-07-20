'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import ArticleCollectionPage from '@/src/views/ArticleCollectionPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><ArticleCollectionPage /></MainLayout></ProtectedRoute>;
}
