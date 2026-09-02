import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as s from './GlossaryTermPage.css.ts';
import { sanitizeRichHtml } from '../lib/sanitize-html.js';

function renderMarkdown(text) {
    if (!text) return null;
    const html = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/— /g, '— <br/>');
    return <span dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }} />;
}

const BACK_ROUTES = {
    'bibliography': { to: '/directory#bibliography', label: 'Back to Bibliography' },
};
const DEFAULT_BACK = { to: '/directory#glossary', label: 'Back to Glossary' };

const GlossaryTermPage = () => {
    const { term: termParam } = useParams();
    const searchParams = useSearchParams();
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);

    const fromState = searchParams.get('from');
    const back = BACK_ROUTES[fromState] || DEFAULT_BACK;

    useEffect(() => {
        async function fetchTerm() {
            setLoading(true);
            const decoded = decodeURIComponent(termParam);
            const { data, error } = await supabase
                .from('glossary')
                .select('*')
                .ilike('term', decoded)
                .single();

            if (error) {
                console.error('Glossary term not found:', error);
                setEntry(null);
            } else {
                setEntry(data);
            }
            setLoading(false);
        }
        fetchTerm();
    }, [termParam]);

    if (loading) {
        return (
            <div className={s.page}>
                <main className={s.main}>
                    <div className={s.loadingWrap}>Loading…</div>
                </main>
            </div>
        );
    }

    if (!entry) {
        return (
            <div className={s.page}>
                <main className={s.main}>
                    <Link href={back.to} className={s.backLink}>
                        <ArrowLeft size={14} /> {back.label}
                    </Link>
                    <div className={s.notFound}>Term not found</div>
                </main>
            </div>
        );
    }

    return (
        <div className={s.page}>
            <main className={s.main}>
                <div className={s.topRow}>
                    <Link href={back.to} className={s.backLink}>
                        <ArrowLeft size={14} /> {back.label}
                    </Link>
                    <div className={s.typeBadge}>{entry.type}</div>
                </div>
                <h1 className={s.termTitle}>{entry.term}</h1>
                <hr className={s.divider} />
                <div className={s.explanation}>{renderMarkdown(entry.explanation)}</div>

                {entry.related_terms && entry.related_terms.length > 0 && (
                    <div className={s.relatedSection}>
                        <h2 className={s.relatedHeading}>Related Terms</h2>
                        <div className={s.relatedList}>
                            {entry.related_terms.map(rt => (
                                <Link
                                    key={rt}
                                    href={`/glossary/${encodeURIComponent(rt)}${fromState ? `?from=${encodeURIComponent(fromState)}` : ''}`}
                                    className={s.relatedChip}
                                >
                                    {rt}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GlossaryTermPage;
