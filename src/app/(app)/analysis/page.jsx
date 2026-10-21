'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import TextBrowser from '@/src/components/Analysis/AnalysisBrowser/TextBrowser.jsx';

export default function Page() {
  return <ProtectedRoute><TextBrowser /></ProtectedRoute>;
}
