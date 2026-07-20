'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import WaitlistAdminPage from '@/src/views/admin/WaitlistAdminPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><WaitlistAdminPage /></MainLayout></AdminRoute>;
}
