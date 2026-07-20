'use client';

import MainLayout from '@/src/components/MainLayout.jsx';
import FeedPage from '@/src/views/FeedPage.jsx';

export default function Page() {
  return <MainLayout hideFab><FeedPage initialSurface="social" /></MainLayout>;
}
