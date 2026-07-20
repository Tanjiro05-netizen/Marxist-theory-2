'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute.jsx';
import MainLayout from '@/src/components/MainLayout.jsx';
import TextBrowser from '@/src/components/Analysis/AnalysisBrowser/TextBrowser.jsx';

export default function Page() {
  return <ProtectedRoute><MainLayout><TextBrowser /></MainLayout></ProtectedRoute>;
}
