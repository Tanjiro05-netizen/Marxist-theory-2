'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import LibraryUploadPage from '@/src/views/admin/LibraryUploadPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><LibraryUploadPage /></MainLayout></AdminRoute>;
}
