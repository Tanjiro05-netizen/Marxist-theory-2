'use client';

import AdminRoute from '@/src/components/AdminRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import ScenarioAdminPage from '@/src/views/admin/ScenarioAdminPage.jsx';

export default function Page() {
  return <AdminRoute><MainLayout><ScenarioAdminPage /></MainLayout></AdminRoute>;
}
