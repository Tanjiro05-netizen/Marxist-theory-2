import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import * as s from './Footer.css.ts';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <p className={s.mark}>© {new Date().getFullYear()} Marxist.info</p>
        <nav className={s.links} aria-label="Footer navigation">
          <Link href="/home" className={s.link}>{t('footer.home')}</Link>
          <Link href="/digital-library" className={s.link}>{t('footer.library')}</Link>
          <Link href="/submit" className={s.link}>{t('submit.submitWork')}</Link>
          <a href="https://JinbuJYG.com" target="_blank" rel="noopener noreferrer" className={s.link}>JinbuJYG.com</a>
        </nav>
      </div>
    </footer>
  );
}
