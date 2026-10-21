'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import LessonPage from '@/src/views/LessonPage.jsx';

export default function Page() {
  return <ProtectedRoute><LessonPage /></ProtectedRoute>;
}
