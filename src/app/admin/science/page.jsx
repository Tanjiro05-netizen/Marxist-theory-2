'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import ScienceAdminPage from '@/src/views/admin/ScienceAdminPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><ScienceAdminPage /></MainLayout></AdminRoute>;
}
