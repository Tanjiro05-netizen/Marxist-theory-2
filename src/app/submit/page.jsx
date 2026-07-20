'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import SubmitPage from '@/src/views/SubmitPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><SubmitPage /></MainLayout></ProtectedRoute>;
}
