'use client';

import RoleRoute from '@/src/components/RoleRoute.jsx';
import PoliticsUploadPage from '@/src/views/admin/PoliticsUploadPage.jsx';

export default function Page() {
  return <RoleRoute allowedEditorialRoles={['News']}><PoliticsUploadPage /></RoleRoute>;
}
