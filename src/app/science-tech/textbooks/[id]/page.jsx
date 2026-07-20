'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import TextbookReaderPage from '@/src/views/TextbookReaderPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><TextbookReaderPage /></MainLayout></ProtectedRoute>;
}
