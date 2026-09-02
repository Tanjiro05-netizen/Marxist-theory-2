'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import DataVisualizationPage from '@/src/views/DataVisualizationPage.jsx';

export default function Page() {
  return <ProtectedRoute><DataVisualizationPage /></ProtectedRoute>;
}
