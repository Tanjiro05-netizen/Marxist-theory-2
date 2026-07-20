'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import RoleManagementPage from '@/src/views/admin/RoleManagementPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><RoleManagementPage /></MainLayout></AdminRoute>;
}
