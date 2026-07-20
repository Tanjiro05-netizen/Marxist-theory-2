'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import AnalysisUploadPage from '@/src/views/admin/AnalysisUploadPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><AnalysisUploadPage /></MainLayout></AdminRoute>;
}
