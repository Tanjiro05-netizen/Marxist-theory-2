'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import ArticleReaderPage from '@/src/views/ArticleReaderPage.jsx';

export default function Page() {
  return <ProtectedRoute><ArticleReaderPage /></ProtectedRoute>;
}
