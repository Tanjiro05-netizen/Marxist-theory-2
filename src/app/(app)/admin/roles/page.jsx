'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import RoleManagementPage from '@/src/views/admin/RoleManagementPage.jsx';

export default function Page() {
  return <AdminRoute><RoleManagementPage /></AdminRoute>;
}
