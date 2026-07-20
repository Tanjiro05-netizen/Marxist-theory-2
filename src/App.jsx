import React from 'react';
import { Book, FileText, BookOpen,
    Newspaper, GraduationCap, HelpCircle, BookMarked, FlaskConical, LineChart,
    Users, Bot, Terminal, Lock } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from './context/AuthContext';
import hammerAndSickleImage from './assets/hammerandsickle.png';
import { Analytics } from '@vercel/analytics/react';
import * as s from './App.css.ts';

const hammerAndSickleImageUrl =
    typeof hammerAndSickleImage === 'string' ? hammerAndSickleImage : hammerAndSickleImage.src;

const App = () => {
    const { user } = useAuth();
    const stats = null;

    const primaryCta = user
        ? { to: '/theory', label: 'Explore Theory' }
        : { to: '/digital-library', label: 'Browse Library' };

    const secondaryCta = user
        ? { to: '/submit', label: 'Submit Work' }
        : { to: '/login', label: 'Register to Unlock' };

    return (
        <div className={s.page}>
            <Analytics />
            <div className={s.hero}>
                <div className={s.heroGrid} />
                <div className={s.heroImageWrap}>
                    <img src={hammerAndSickleImageUrl} alt="Background" className={s.heroImage} />
                </div>

                <div className={s.heroContent}>
                    <div className={s.heroCopy}>
                        <h1 className={s.heroTitle}>marxist.info</h1>
                        <p className={s.heroSubtitle}>
                            A platform for Marxist theory, education, and analysis.
                        </p>
                        <div className={s.heroCtas}>
                            <Link href={primaryCta.to} className={s.ctaPrimary}>
                                {primaryCta.label}
                            </Link>
                            <Link href={secondaryCta.to} className={s.ctaSecondary}>
                                {secondaryCta.label}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <section className={s.aboutSection}>
                <div className={s.aboutInner}>
                    <h2 className={s.aboutTitle}>About</h2>
                    <p className={s.aboutText}>
                        A platform for the study and discussion of Marxist theory, political economy, and history. We aim to provide a well-organised space for reading, research, and debate.
                    </p>
                    <div className={s.aboutGrid}>
                        <div className={s.aboutCard}>
                            <div className={s.aboutIconFrame}>
                                <Book size={24} />
                            </div>
                            <div>
                                <h3 className={s.aboutCardTitle}>Research Focus</h3>
                                <p className={s.aboutCardText}>In-depth analysis of contemporary social, economic, and political developments from a Marxist perspective.</p>
                            </div>
                        </div>
                        <div className={s.aboutCard}>
                            <div className={s.aboutIconFrame}>
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className={s.aboutCardTitle}>Publication Platform</h3>
                                <p className={s.aboutCardText}>A space for writers and researchers to publish analysis, commentary, and theoretical work.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Members-only features (guest view only) */}
            {!user && (
                <section className={s.guestSection}>
                    <div className={s.guestInner}>
                        <div className={s.guestHeader}>
                            <span className={s.guestBadge}>
                                <Lock size={14} />
                                Members Only
                            </span>
                            <h2 className={s.guestTitle}>Members-Only Sections</h2>
                            <p className={s.guestSubtitle}>
                                Register to unlock the full platform. Here's what awaits inside.
                            </p>
                        </div>

                        {stats && (
                            <div className={s.statsRow}>
                                {[
                                    { value: stats.books, label: 'Books in Library' },
                                    { value: stats.articles, label: 'Theory Articles' },
                                    { value: stats.glossary, label: 'Glossary Terms' },
                                    { value: stats.members, label: 'Members' },
                                ].filter(s => s.value > 0).map((stat, i) => (
                                    <div key={i} className={s.statCard}>
                                        <div className={s.statNumber}>{stat.value}</div>
                                        <div className={s.statLabel}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={s.guestGrid}>
                            {[
                                { icon: Newspaper, title: 'Politics', desc: 'News, analysis, and commentary on current events. Members only.' },
                                { icon: GraduationCap, title: 'Study Center', desc: 'Structured learning paths, curated reading lists, and progress tracking. Members only.' },
                                { icon: BookMarked, title: 'Theory', desc: 'In-depth articles and texts with advanced reading tools. Members only.' },
                                { icon: HelpCircle, title: 'Knowledge Base', desc: 'A community Q&A and reference resource. Members only.' },
                                { icon: BookOpen, title: 'Glossary', desc: 'An interconnected reference of key concepts, terms, and definitions. Members only.' },
                                { icon: FlaskConical, title: 'Science & Tech', desc: 'Courses and reference material spanning the natural sciences, mathematics, and technology. Members only.' },
                                { icon: LineChart, title: 'Data & Visualizations', desc: 'Interactive charts and dashboards covering economic and social indicators. Members only.' },
                                { icon: Users, title: 'Directory', desc: 'Browse and connect with other members of the platform. Members only.' },
                                { icon: Terminal, title: 'World Sim', desc: 'A historical simulation and strategy experience. Members only.' },
                                { icon: Bot, title: 'MarxBot', desc: 'An AI assistant for research, reading, and analysis. Members only.' },
                            ].map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <div key={i} className={s.featureCard}>
                                        <div className={s.featureRow}>
                                            <div className={s.featureIconFrame}>
                                                <Icon size={18} />
                                            </div>
                                            <div className={s.featureBody}>
                                                <div className={s.featureHeader}>
                                                    <h3 className={s.featureTitle}>{feature.title}</h3>
                                                    <span className={s.featureTag}>Members Only</span>
                                                </div>
                                                <p className={s.featureDesc}>{feature.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={s.guestCta}>
                            <Link href="/login" className={s.ctaPrimary}>
                                Register to Unlock
                                <Lock size={16} />
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default App;
