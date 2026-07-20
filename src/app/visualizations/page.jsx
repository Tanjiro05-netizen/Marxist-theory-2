'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import DataVisualizationPage from '@/src/views/DataVisualizationPage.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><DataVisualizationPage /></MainLayout></ProtectedRoute>;
}
