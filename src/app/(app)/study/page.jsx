'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import StudyPage from '@/src/views/StudyPage.jsx';

export default function Page() {
  return <ProtectedRoute><StudyPage /></ProtectedRoute>;
}
