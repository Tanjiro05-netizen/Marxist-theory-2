'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import CoursePage from '@/src/views/CoursePage.jsx';

export default function Page() {
  return <ProtectedRoute><CoursePage /></ProtectedRoute>;
}
