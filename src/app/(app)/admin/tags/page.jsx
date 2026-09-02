'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import TagManagementPage from '@/src/views/admin/TagManagementPage.jsx';

export default function Page() {
  return <AdminRoute><TagManagementPage /></AdminRoute>;
}
