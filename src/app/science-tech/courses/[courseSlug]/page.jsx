'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import CoursePage from '@/src/views/CoursePage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><CoursePage /></MainLayout></ProtectedRoute>;
}
