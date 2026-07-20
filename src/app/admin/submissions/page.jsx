'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import AdminSubmissionsPage from '@/src/views/AdminSubmissionsPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><AdminSubmissionsPage /></MainLayout></AdminRoute>;
}
