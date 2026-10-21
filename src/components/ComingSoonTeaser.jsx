import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as s from '../views/ComingSoonPage.css.ts';

/* Extracted from ComingSoonPage so recharts can be code-split — the
   coming-soon screen no longer ships a chart library in its chunk.
   Markup is identical to the original VisualizationTeaser. */

const CLASS_DATA = [
    { name: 'Working Class', value: 60, color: '#b3122e' },
    { name: 'Middle Class', value: 30, color: '#d8c79f' },
    { name: 'Capitalist Class', value: 10, color: '#2d8a4e' },
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

const ComingSoonTeaser = () => (
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
                        <Tooltip contentStyle={{ background: '#151924', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
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
                        <Line type="monotone" dataKey="gini" stroke="#b3122e" strokeWidth={2} dot={{ fill: '#b3122e', r: 3 }} />
                        <Tooltip contentStyle={{ background: '#151924', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    </ReLineChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

export default ComingSoonTeaser;
