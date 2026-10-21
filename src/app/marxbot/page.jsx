'use client';

import dynamic from 'next/dynamic';

const MarxBotPage = dynamic(() => import('@/src/views/MarxBotPage.jsx'), {
  ssr: false,
});

export default function Page() {
  return <MarxBotPage />;
}
