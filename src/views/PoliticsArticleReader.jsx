import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Newspaper, Tag } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import * as s from './PoliticsArticleReader.css.ts';

const formatDate = (value) => {
    if (!value) return 'Undated';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Undated';
    return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const isValidEditionDate = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.toISOString().slice(0, 10) === value;
};

const rankRelatedDispatches = (items, baseArticle) => {
    if (!Array.isArray(items)) return [];

    const baseEdition = `${baseArticle?.edition_date || ''}`;
    const baseCategory = `${baseArticle?.category || ''}`.toLowerCase();

    return [...items].sort((left, right) => {
        const leftEditionScore = `${left?.edition_date || ''}` === baseEdition ? 1 : 0;
        const rightEditionScore = `${right?.edition_date || ''}` === baseEdition ? 1 : 0;
        if (leftEditionScore !== rightEditionScore) return rightEditionScore - leftEditionScore;

        const leftCategoryScore = `${left?.category || ''}`.toLowerCase() === baseCategory ? 1 : 0;
        const rightCategoryScore = `${right?.category || ''}`.toLowerCase() === baseCategory ? 1 : 0;
        if (leftCategoryScore !== rightCategoryScore) return rightCategoryScore - leftCategoryScore;

        const leftTime = new Date(left?.published_at || left?.created_at || 0).getTime();
        const rightTime = new Date(right?.published_at || right?.created_at || 0).getTime();
        return rightTime - leftTime;
    });
};

const PoliticsArticleReader = () => {
    const { slug } = useParams();
    const { canManagePolitics } = useAuth();
    const canEditPolitics = canManagePolitics();

    const editionParam = useMemo(() => {
        if (typeof window === 'undefined') return '';
        return new URLSearchParams(window.location.search).get('edition') || '';
    }, []);

    const backToFeedHref =
        isValidEditionDate(editionParam)
            ? `/politics?edition=${editionParam}`
            : '/politics';

    const [article, setArticle] = useState(null);
    const [relatedDispatches, setRelatedDispatches] = useState([]);
    const [adjacentDispatches, setAdjacentDispatches] = useState({ previous: null, next: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArticle = async () => {
            if (!slug) {
                setError('No article slug provided.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                let query = supabase
                    .from('politics_articles')
                    .select('*')
                    .eq('slug', slug);

                if (!canEditPolitics) {
                    query = query.eq('status', 'published');
                }

                const { data, error: fetchError } = await query.maybeSingle();
                if (fetchError) throw fetchError;

                if (!data) {
                    throw new Error('Dispatch not found for this edition.');
                }

                setArticle(data);

                const [relatedResponse, editionResponse] = await Promise.all([
                    (async () => {
                        let relatedQuery = supabase
                            .from('politics_articles')
                            .select('id, slug, title, category, source, edition_date, published_at, created_at, status')
                            .neq('slug', slug)
                            .order('published_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false })
                            .limit(20);

                        if (!canEditPolitics) {
                            relatedQuery = relatedQuery.eq('status', 'published');
                        }

                        return relatedQuery;
                    })(),
                    (async () => {
                        if (!data?.edition_date) {
                            return { data: [], error: null };
                        }

                        let editionQuery = supabase
                            .from('politics_articles')
                            .select('id, slug, title, edition_date, published_at, created_at, status')
                            .eq('edition_date', data.edition_date)
                            .order('published_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false })
                            .limit(120);

                        if (!canEditPolitics) {
                            editionQuery = editionQuery.eq('status', 'published');
                        }

                        return editionQuery;
                    })(),
                ]);

                if (relatedResponse.error) throw relatedResponse.error;
                if (editionResponse.error) throw editionResponse.error;

                const rankedRelated = rankRelatedDispatches(relatedResponse.data || [], data)
                    .filter((item) => item.slug !== slug)
                    .slice(0, 4);
                setRelatedDispatches(rankedRelated);

                const editionStories = (editionResponse.data || []).filter((item) => item.slug);
                const currentIndex = editionStories.findIndex((item) => item.slug === slug);

                if (currentIndex >= 0) {
                    setAdjacentDispatches({
                        previous: editionStories[currentIndex - 1] || null,
                        next: editionStories[currentIndex + 1] || null,
                    });
                } else {
                    setAdjacentDispatches({ previous: null, next: null });
                }
            } catch (err) {
                console.error('Error fetching politics article:', err);
                setError(err.message || 'Failed to load dispatch.');
                setArticle(null);
                setRelatedDispatches([]);
                setAdjacentDispatches({ previous: null, next: null });
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [slug, canEditPolitics]);

    const renderedContent = useMemo(() => {
        if (!article?.content) return null;
        return (
            <div className="prose prose-invert prose-red max-w-none leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {article.content}
                </ReactMarkdown>
            </div>
        );
    }, [article?.content]);

    if (loading) {
        return (
            <div className={s.page}>
                <div className={s.main}>
                    <p style={{color:'rgba(255,255,255,0.48)'}}>Loading dispatch...</p>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className={s.page}>
                <div className={s.main} style={{background:'#1a1f2b',border:'1px solid rgba(255,255,255,0.06)',borderRadius:18,padding:32}}>
                    <h1 className="text-2xl font-semibold mb-3">Dispatch unavailable</h1>
                    <p className="text-gray-400 mb-6">{error || 'This dispatch is unavailable right now.'}</p>
                    <Link href={backToFeedHref}
                        className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                        <ArrowLeft size={18} /> Back to politics front page
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={s.page}>
            <article className={s.main}>
                <Link href={backToFeedHref} className={s.backLink}>
                    <ArrowLeft size={16} /> Back to front page
                </Link>

                <header className={s.articleCard}>
                    <div className={s.badgeRow}>
                        <span className={`${s.badge} ${s.badgeAccent}`}>
                            <Tag size={12} /> {article.category || 'analysis'}
                        </span>
                        {article.status && (
                            <span className={`${s.badge} ${s.badgeDefault}`}>
                                <Newspaper size={12} /> {article.status}
                            </span>
                        )}
                    </div>

                    <h1 className={s.articleTitle}>{article.title || 'Untitled dispatch'}</h1>

                    {article.excerpt && (
                        <p className={s.articleExcerpt}>{article.excerpt}</p>
                    )}

                    <div className={s.articleMeta}>
                        <span className={s.metaItem}>
                            <CalendarDays size={15} />
                            {formatDate(article.published_at || article.created_at)}
                        </span>
                        <span>By {article.source || 'Editorial Desk'}</span>
                    </div>
                </header>

                {article.image_url && (
                    <div className={s.imageWrap}>
                        <img src={article.image_url} alt={article.title || 'Politics dispatch image'} className={s.articleImage} />
                    </div>
                )}

                <section className={s.contentCard}>
                    {renderedContent || (
                        <p className={s.contentBody}>{article.content || 'No article body available for this dispatch yet.'}</p>
                    )}
                </section>

                {(adjacentDispatches.previous || adjacentDispatches.next) && (
                    <section className={s.navSection}>
                        <h2 className={s.navTitle}>Navigate this edition</h2>
                        <div className={s.navGrid}>
                            {adjacentDispatches.previous ? (
                                <Link href={`/politics/${adjacentDispatches.previous.slug}?edition=${article.edition_date || editionParam}`} className={s.navCard}>
                                    <p className={s.navLabel}><ChevronLeft size={13} /> Previous in edition</p>
                                    <p className={s.navCardTitle}>{adjacentDispatches.previous.title}</p>
                                </Link>
                            ) : (
                                <div className={s.navCardEmpty}>No previous dispatch</div>
                            )}
                            {adjacentDispatches.next ? (
                                <Link href={`/politics/${adjacentDispatches.next.slug}?edition=${article.edition_date || editionParam}`} className={s.navCard}>
                                    <p className={s.navLabel}>Next in edition <ChevronRight size={13} /></p>
                                    <p className={s.navCardTitle}>{adjacentDispatches.next.title}</p>
                                </Link>
                            ) : (
                                <div className={s.navCardEmpty}>No next dispatch</div>
                            )}
                        </div>
                    </section>
                )}

                {relatedDispatches.length > 0 && (
                    <section className={s.navSection}>
                        <h2 className={s.navTitle}>Related dispatches</h2>
                        <div className={s.navGrid}>
                            {relatedDispatches.map((related) => (
                                <Link key={related.id || related.slug} href={`/politics/${related.slug}?edition=${related.edition_date || article.edition_date || editionParam}`} className={s.navCard}>
                                    <p className={s.relatedMeta}>{related.category || 'analysis'} · {formatDate(related.published_at || related.created_at)}</p>
                                    <p className={s.relatedTitle}>{related.title}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </div>
    );
};

export default PoliticsArticleReader;
