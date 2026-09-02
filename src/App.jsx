import React from 'react';
import { FileText, BookOpen, GraduationCap, Newspaper,
    FlaskConical, LineChart, HelpCircle, Users, Radio,
    Lock, ArrowUpRight, Book } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from './context/AuthContext';
import hammerAndSickleImage from './assets/hammerandsickle.png';
import { Analytics } from '@vercel/analytics/react';
import * as s from './App.css.ts';

const hammerAndSickleImageUrl =
    typeof hammerAndSickleImage === 'string' ? hammerAndSickleImage : hammerAndSickleImage.src;

/* The platform table of contents — mirrors the navband order */
const SECTIONS = [
    { to: '/theory', icon: FileText, title: 'Theory', desc: 'Foundational texts and study guides with advanced reading tools.', guest: false },
    { to: '/analysis', icon: BookOpen, title: 'Analysis', desc: 'Annotated papers, close reading, and companion analysis.', guest: false },
    { to: '/digital-library', icon: Book, title: 'Digital Library', desc: 'An expanding collection of essential Marxist texts and analyses.', guest: true },
    { to: '/study', icon: GraduationCap, title: 'Study Center', desc: 'Structured learning paths, curated reading lists, and progress tracking.', guest: false },
    { to: '/science-tech', icon: FlaskConical, title: 'Science & Tech', desc: 'Courses and reference material across the natural sciences and mathematics.', guest: false },
    { to: '/politics', icon: Newspaper, title: 'Politics', desc: 'News, analysis, and commentary on current events.', guest: false },
    { to: '/visualizations', icon: LineChart, title: 'Data & Visualizations', desc: 'Interactive charts and dashboards covering economic and social indicators.', guest: false },
    { to: '/knowledge', icon: HelpCircle, title: 'Knowledge Base', desc: 'A community Q&A and reference resource.', guest: false },
    { to: '/directory', icon: Users, title: 'Directory', desc: 'Browse and connect with other members of the platform.', guest: false },
    { to: '/feed', icon: Radio, title: 'Feed', desc: 'Activity and discussion from across the platform.', guest: true },
];

const App = () => {
    const { user } = useAuth();

    const primaryCta = user
        ? { to: '/theory', label: 'Explore Theory' }
        : { to: '/digital-library', label: 'Browse Library' };

    const secondaryCta = user
        ? { to: '/submit', label: 'Submit Work' }
        : { to: '/login', label: 'Register to Unlock' };

    return (
        <div className={s.page}>
            <Analytics />

            {/* ── Front page hero — original imagery, editorial composition ── */}
            <section className={s.hero}>
                <div className={s.heroGrid} />
                <div className={s.heroImageWrap}>
                    <img src={hammerAndSickleImageUrl} alt="Background" className={s.heroImage} />
                </div>

                <span className={`${s.heroCorner} ${s.heroCornerLeft}`} aria-hidden="true">
                    Marxists.Info
                </span>
                <span className={`${s.heroCorner} ${s.heroCornerRight}`} aria-hidden="true">
                    Theory · Education · Analysis
                </span>

                <div className={s.heroContent}>
                    <div className={s.heroCopy}>
                        <h1 className={s.heroTitle}>
                            marxist<span className={s.heroDot}>.</span>info
                        </h1>
                        <div className={s.heroRule} aria-hidden="true" />
                        <p className={s.heroSubtitle}>
                            A platform for Marxist theory, education, and analysis.
                        </p>
                        <div className={s.heroCtas}>
                            <Link href={primaryCta.to} className={s.ctaPrimary}>
                                {primaryCta.label}
                            </Link>
                            <Link href={secondaryCta.to} className={s.ctaGhost}>
                                {secondaryCta.label}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={s.scrollCue} aria-hidden="true">
                    <span className={s.scrollLabel}>Scroll</span>
                    <span className={s.scrollLine} />
                </div>
            </section>

            {/* ── Inside the Platform — shared-wall table of contents ── */}
            <section className={s.sectionBlock}>
                <div className={s.innerWrap}>
                    {!user && (
                        <div className={s.guestIntro}>
                            <span className={s.guestBadge}>
                                <Lock size={13} />
                                Members Only
                            </span>
                            <p className={s.guestLead}>
                                Register to unlock the full platform. Here&apos;s what awaits inside.
                            </p>
                        </div>
                    )}

                    <div className={s.sectionRow}>
                        <span className={s.sectionLabel}>Inside the Platform</span>
                        <span className={s.sectionIndex}>
                            {String(SECTIONS.length).padStart(2, '0')} Sections
                        </span>
                    </div>

                    <div className={s.grid}>
                        {SECTIONS.map((section, i) => {
                            const Icon = section.icon;
                            const restricted = !user && !section.guest;
                            const href = restricted ? '/login' : section.to;
                            return (
                                <Link key={section.to} href={href} className={s.cell}>
                                    <span className={s.iconFrame}>
                                        <Icon size={18} strokeWidth={1.6} />
                                    </span>
                                    <span className={s.cellBody}>
                                        <span className={s.cellHeader}>
                                            <span className={s.cellIndex}>{String(i + 1).padStart(2, '0')}</span>
                                            <span className={s.cellTitle}>{section.title}</span>
                                            {restricted && <span className={s.cellTag}>Members Only</span>}
                                        </span>
                                        <span className={s.cellDesc}>{section.desc}</span>
                                    </span>
                                    <span className={s.cellArrow}>
                                        {restricted
                                            ? <Lock size={14} strokeWidth={1.6} />
                                            : <ArrowUpRight size={16} strokeWidth={1.6} />}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── About — the original cards as an epigraph feature ── */}
            <section className={s.aboutSection}>
                <div className={s.aboutInner}>
                    <p className={s.aboutKicker}>About the Project</p>
                    <p className={s.epigraph}>
                        A platform for the study and discussion of Marxist theory, political economy,
                        and history — a well-organised space for reading, research, and debate.
                    </p>
                    <div className={s.aboutGrid}>
                        <div className={s.aboutCell}>
                            <span className={s.aboutIconFrame}>
                                <Book size={22} strokeWidth={1.6} />
                            </span>
                            <div>
                                <h3 className={s.aboutCardTitle}>Research Focus</h3>
                                <p className={s.aboutCardText}>
                                    In-depth analysis of contemporary social, economic, and political
                                    developments from a Marxist perspective.
                                </p>
                            </div>
                        </div>
                        <div className={s.aboutCell}>
                            <span className={s.aboutIconFrame}>
                                <FileText size={22} strokeWidth={1.6} />
                            </span>
                            <div>
                                <h3 className={s.aboutCardTitle}>Publication Platform</h3>
                                <p className={s.aboutCardText}>
                                    A space for writers and researchers to publish analysis, commentary,
                                    and theoretical work.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Closing CTA (guests) ── */}
            {!user && (
                <section className={s.sectionBlock}>
                    <div className={`${s.innerWrap} ${s.ctaBand}`}>
                        <Link href="/login" className={s.ctaPrimary}>
                            Register to Unlock
                            <Lock size={14} />
                        </Link>
                        <Link href="/digital-library" className={s.ctaGhost}>
                            Browse the Library
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
};

export default App;
