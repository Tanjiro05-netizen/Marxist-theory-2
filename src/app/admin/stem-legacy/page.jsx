'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import STEMAdminPage from '@/src/views/admin/STEMAdminPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><STEMAdminPage /></MainLayout></AdminRoute>;
}
