'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import ChapterTestPage from '@/src/views/ChapterTestPage.jsx';

export default function Page() {
  return <ProtectedRoute><ChapterTestPage /></ProtectedRoute>;
}
