import React from 'react';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import { useAuth } from './context/AuthContext';
import PublicationContents from './components/PublicationContents';
import * as s from './App.css.ts';

export default function App() {
  const { user } = useAuth();
  return (
    <div className={s.page}>
      <Analytics />
      <section className={s.contents} data-testid="home-contents">
        <header className={s.heading}>
          <h1 className={s.title}>Contents</h1>
          <Link href="/submit" className={s.submit}>Submit Work</Link>
        </header>
        <PublicationContents user={user} columns />
      </section>
    </div>
  );
}
