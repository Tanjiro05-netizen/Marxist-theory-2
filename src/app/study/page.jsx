'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import StudyPage from '@/src/views/StudyPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><StudyPage /></MainLayout></ProtectedRoute>;
}
