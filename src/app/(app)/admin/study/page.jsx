'use client';

import RoleRoute from '@/src/components/RoleRoute.jsx';
import StudyAdminPage from '@/src/views/admin/StudyAdminPage.jsx';

export default function Page() {
  return <RoleRoute allowedEditorialRoles={['Teacher']}><StudyAdminPage /></RoleRoute>;
}
