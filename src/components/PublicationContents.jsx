import React from 'react';
import Link from 'next/link';
import { FileText, BookOpen, Book, GraduationCap, FlaskConical, Newspaper, LineChart, HelpCircle, Users, Radio } from 'lucide-react';
import * as s from './PublicationContents.css.ts';

const SECTIONS = [
  { href: '/theory', title: 'Theory', icon: FileText },
  { href: '/analysis', title: 'Analysis', icon: BookOpen },
  { href: '/digital-library', title: 'Digital Library', icon: Book, guest: true },
  { href: '/study', title: 'Study Center', icon: GraduationCap },
  { href: '/science-tech', title: 'Science & Tech', icon: FlaskConical },
  { href: '/politics', title: 'Politics', icon: Newspaper },
  { href: '/visualizations', title: 'Data & Visualizations', icon: LineChart },
  { href: '/knowledge', title: 'Knowledge Base', icon: HelpCircle },
  { href: '/directory', title: 'Directory', icon: Users },
  { href: '/feed', title: 'Feed', icon: Radio, guest: true },
];

export default function PublicationContents({ user, columns = false, onRestrictedClick }) {
  return (
    <ol className={`${s.list} ${columns ? s.columns : ''}`} data-testid="publication-contents">
      {SECTIONS.map((section, index) => {
        const restricted = !user && !section.guest;
        const Icon = section.icon;
        return (
          <li key={section.href} className={s.item}>
            <Link
              href={restricted ? '/login' : section.href}
              className={s.link}
              onClick={restricted && onRestrictedClick ? (event) => {
                event.preventDefault();
                onRestrictedClick();
              } : undefined}
            >
              <span className={s.number} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className={s.iconFrame} aria-hidden="true"><Icon size={17} strokeWidth={1.75} /></span>
              <span className={s.title}>{section.title}</span>
              {restricted && <span className={s.access}>Members</span>}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
