'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import KnowledgeTopicAdminPage from '@/src/views/admin/KnowledgeTopicAdminPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><KnowledgeTopicAdminPage /></MainLayout></AdminRoute>;
}
