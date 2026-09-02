'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import TextbookReaderPage from '@/src/views/TextbookReaderPage.jsx';

export default function Page() {
  return <ProtectedRoute><TextbookReaderPage /></ProtectedRoute>;
}
