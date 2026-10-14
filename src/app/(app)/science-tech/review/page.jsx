'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import ScienceReviewPage from '@/src/views/ScienceReviewPage.jsx';

export default function Page() {
  return <ProtectedRoute><ScienceReviewPage /></ProtectedRoute>;
}
