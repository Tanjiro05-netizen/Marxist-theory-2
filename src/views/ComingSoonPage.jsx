import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, BookMarked, GraduationCap, FlaskConical, LineChart, Users, MessageSquare, HelpCircle, Newspaper } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as s from './ComingSoonPage.css.ts';

const FEATURE_CONFIG = {
    theory: {
        icon: BookMarked,
        title: 'Theory',
        desc: 'In-depth articles and texts with advanced reading tools. Available to members.',
    },
    study: {
        icon: GraduationCap,
        title: 'Study Center',
        desc: 'Structured learning paths, curated reading lists, and progress tracking. Available to members.',
    },
    'science-tech': {
        icon: FlaskConical,
        title: 'Science & Technology',
        desc: 'Courses and reference material spanning the natural sciences, mathematics, and technology. Available to members.',
    },
    visualizations: {
        icon: LineChart,
        title: 'Data & Visualizations',
        desc: 'Interactive charts and dashboards covering economic and social indicators. Available to members.',
    },
    directory: {
        icon: Users,
        title: 'Directory',
        desc: '',
    },
    forum: {
        icon: MessageSquare,
        title: 'Forum',
        desc: 'A space for discussion, debate, and collaborative reading. Available to members.',
    },
    knowledge: {
        icon: HelpCircle,
        title: 'Knowledge Base',
        desc: 'A community Q&A and reference resource. Available to members.',
    },
    politics: {
        icon: Newspaper,
        title: 'Politics',
        desc: 'News, analysis, and commentary on current events. Available to members.',
    },
};

const CLASS_DATA = [
    { name: 'Working Class', value: 60, color: '#c81e1e' },
    { name: 'Middle Class', value: 30, color: '#ffb800' },
    { name: 'Capitalist Class', value: 10, color: '#2ed573' },
];

const GINI_DATA = [
    { year: '1980', gini: 0.30 },
    { year: '1985', gini: 0.33 },
    { year: '1990', gini: 0.35 },
    { year: '1995', gini: 0.38 },
    { year: '2000', gini: 0.39 },
    { year: '2005', gini: 0.40 },
    { year: '2010', gini: 0.42 },
    { year: '2015', gini: 0.43 },
    { year: '2020', gini: 0.45 },
];

const VisualizationTeaser = () => (
    <div className={s.teaserSection}>
        <div className={s.teaserGrid}>
            <div className={s.teaserCard}>
                <div className={s.teaserOverlay}>
                    <span className={s.teaserOverlayText}>Sign in to explore the full dashboard</span>
                    <Link href="/login" className={s.teaserOverlayCta}>
                        <Lock size={14} />
                        Register
                    </Link>
                </div>
                <div className={s.teaserLabel}>Class Composition</div>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie data={CLASS_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                            {CLASS_DATA.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className={s.teaserCard}>
                <div className={s.teaserOverlay}>
                    <span className={s.teaserOverlayText}>Sign in to explore the full dashboard</span>
                    <Link href="/login" className={s.teaserOverlayCta}>
                        <Lock size={14} />
                        Register
                    </Link>
                </div>
                <div className={s.teaserLabel}>Inequality Trend (Gini Index)</div>
                <ResponsiveContainer width="100%" height={200}>
                    <ReLineChart data={GINI_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="year" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0.25, 0.50]} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Line type="monotone" dataKey="gini" stroke="#c81e1e" strokeWidth={2} dot={{ fill: '#c81e1e', r: 3 }} />
                        <Tooltip contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    </ReLineChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

const ComingSoonPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const featureKey = searchParams.get('feature');
    const feature = FEATURE_CONFIG[featureKey];
    const FeatureIcon = feature?.icon;

    return (
        <div className={s.page}>
            <div className={s.inner}>
                {feature && (
                    <div className={s.featureIconFrame}>
                        <FeatureIcon size={28} />
                    </div>
                )}

                <h1 className={s.title}>{feature ? feature.title : 'Coming Soon'}</h1>
                <div className={s.rule} />

                <p className={s.subtitle}>
                    {feature ? feature.desc : 'This section is under active development and will be available soon.'}
                </p>

                {featureKey === 'visualizations' && <VisualizationTeaser />}

                {!feature && (
                    <div className={s.card}>
                        <h2 className={s.cardTitle}>What to expect</h2>
                        <p className={s.cardText}>
                            This section is currently in development. A range of reading, research, 
                            and community features are planned for members.
                        </p>
                        <p className={s.cardText}>
                            Check back soon or register to be notified when this feature becomes available.
                        </p>
                    </div>
                )}

                {feature && (
                    <Link href="/login" className={s.registerCta}>
                        <Lock size={16} />
                        Register to Unlock
                    </Link>
                )}

                <button onClick={() => router.push('/')} className={s.backButton}>
                    <ArrowLeft size={16} />
                    Return to Homepage
                </button>
            </div>
        </div>
    );
};

export default ComingSoonPage;
