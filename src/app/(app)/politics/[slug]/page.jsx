'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import PoliticsArticleReader from '@/src/views/PoliticsArticleReader.jsx';

export default function Page() {
  return <ProtectedRoute><PoliticsArticleReader /></ProtectedRoute>;
}
