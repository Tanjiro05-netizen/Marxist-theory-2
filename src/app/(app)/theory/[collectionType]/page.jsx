'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import ArticleCollectionPage from '@/src/views/ArticleCollectionPage.jsx';

export default function Page() {
  return <ProtectedRoute><ArticleCollectionPage /></ProtectedRoute>;
}
