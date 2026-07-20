'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import TagManagementPage from '@/src/views/admin/TagManagementPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><TagManagementPage /></MainLayout></AdminRoute>;
}
