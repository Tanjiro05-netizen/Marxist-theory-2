import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import * as s from './Footer.css.ts';

/**
 * Global publication footer — ink band, hairline, wordmark seal, epigraph.
 */
const Footer = () => {
  const { t } = useTranslation();
  const sections = [
    { href: '/home', label: t('footer.home') },
    { href: '/theory', label: t('footer.theory') },
    { href: '/analysis', label: t('footer.analysis') },
    { href: '/digital-library', label: t('footer.library') },
    { href: '/study', label: t('footer.study') },
    { href: '/politics', label: t('footer.politics') },
    { href: '/substack', label: t('footer.bulletin') },
    { href: '/feed', label: t('footer.feed') },
  ];

  return (
  <footer className={s.footer}>
    <div className={s.inner}>
      <div className={s.col}>
        <p className={s.wordmark}>
          Marxists<span className={s.wordmarkDot}>.</span>Info
        </p>
        <span className={s.rule} aria-hidden="true" />
        <p className={s.mission}>{t('footer.mission')}</p>
      </div>

      <div className={s.col}>
        <p className={s.colLabel}>{t('footer.sections')}</p>
        <div className={s.linkGrid}>
          {sections.map((l) => (
            <Link key={l.href} href={l.href} className={s.link}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className={s.col}>
        <p className={s.colLabel}>{t('footer.epigraphLabel', { defaultValue: 'Epigraph' })}</p>
        <p className={s.epigraph}>{t('footer.epigraph')}</p>
        <p className={s.attribution}>{t('footer.attribution')}</p>
      </div>
    </div>

    <div className={s.metaRow}>
      <p className={s.meta}>Marxists.Info &mdash; {t('footer.meta')}</p>
    </div>
  </footer>
  );
};

export default Footer;
