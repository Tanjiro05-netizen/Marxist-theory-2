'use client';

import RoleRoute from '@/src/components/RoleRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import StudyAdminPage from '@/src/views/admin/StudyAdminPage.jsx';

export default function Page() {
  return <RoleRoute allowedEditorialRoles={['Teacher']}><MainLayout><StudyAdminPage /></MainLayout></RoleRoute>;
}
