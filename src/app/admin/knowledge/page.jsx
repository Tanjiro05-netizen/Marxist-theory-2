'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import KnowledgeModerationPage from '@/src/views/admin/KnowledgeModerationPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><KnowledgeModerationPage /></MainLayout></AdminRoute>;
}
