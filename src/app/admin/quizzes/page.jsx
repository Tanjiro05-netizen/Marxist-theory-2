'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import QuizAdminPage from '@/src/views/admin/QuizAdminPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><QuizAdminPage /></MainLayout></AdminRoute>;
}
