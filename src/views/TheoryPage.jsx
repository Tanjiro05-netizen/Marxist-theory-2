import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronRight, Search, Bookmark, BookOpen, BookOpenCheck, BarChart3, Plus, Send, Check, Loader2, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { prefetchQuery, invalidateQuery } from '../lib/queryCache';
import PageHeader from '../components/PageHeader';
import * as s from './TheoryPage.css.ts';

const TheoryPage = () => {

    const { user, isAdmin } = useAuth();
    const router = useRouter();
    // Key data effects on the stable id string — not the user object, which
    // is re-created on every session re-sync (tab focus) and would re-run
    // the whole query chain.
    const userId = user?.id;

    // State for data, loading, and errors
    const [categories, setCategories] = useState([]);
    const [articles, setArticles] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Community writings state
    const [communityTexts, setCommunityTexts] = useState([]);
    const [loadingCommunity, setLoadingCommunity] = useState(true);
    const [savedTextIds, setSavedTextIds] = useState(new Set());
    const [savingTextId, setSavingTextId] = useState(null);

    // Fetch categories once on component mount (cached — instant on revisit)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingCategories(true);
            try {
                const data = await prefetchQuery('theory:categories', async () => {
                    const { data, error } = await supabase
                        .from('theory_categories')
                        .select('id, name')
                        .order('name', { ascending: true });
                    if (error) throw error;
                    return data;
                });
                if (cancelled) return;
                setCategories(data);
                // Set the first category as active by default
                if (data.length > 0) {
                    setActiveCategory(data[0].id);
                }
            } catch (err) {
                setError(err.message);
                console.error("Error fetching categories:", err);
            } finally {
                setLoadingCategories(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Fetch articles when the active category changes (cached base rows;
    // user progress/bookmarks come from a per-user cache — one round each,
    // instant on revisit)
    useEffect(() => {
        if (!activeCategory) return;

        let cancelled = false;
        (async () => {
            setLoadingArticles(true);
            setError(null);
            try {
                const base = await prefetchQuery(`theory:articles:${activeCategory}`, async () => {
                    const { data, error } = await supabase
                        .from('theory_articles')
                        .select('id, title, slug, excerpt, estimated_time_min, collection, is_featured, category_id')
                        .eq('category_id', activeCategory);
                    if (error) throw error;
                    return data;
                });
                if (cancelled) return;

                if (userId && userId !== 'dev-admin') {
                    const meta = await prefetchQuery(`theory:usermeta:${userId}`, async () => {
                        const [progressRes, bookmarksRes] = await Promise.all([
                            supabase
                                .from('user_article_progress')
                                .select('article_id, progress_percentage')
                                .eq('user_id', userId),
                            supabase
                                .from('user_article_bookmarks')
                                .select('article_id')
                                .eq('user_id', userId),
                        ]);
                        return { progressRes, bookmarksRes };
                    });
                    if (cancelled) return;
                    if (meta.progressRes.error) console.error('Error fetching progress:', meta.progressRes.error);
                    if (meta.bookmarksRes.error) console.error('Error fetching bookmarks:', meta.bookmarksRes.error);

                    const progressMap = new Map(meta.progressRes.data?.map(p => [p.article_id, p.progress_percentage]) || []);
                    const bookmarkedSet = new Set(meta.bookmarksRes.data?.map(b => b.article_id) || []);

                    setArticles(base.map(article => ({
                        ...article,
                        progress: progressMap.get(article.id) || 0,
                        isBookmarked: bookmarkedSet.has(article.id),
                    })));
                } else {
                    setArticles(base.map(a => ({ ...a, progress: 0, isBookmarked: false })));
                }
            } catch (err) {
                setError(err.message);
                console.error("Error fetching articles:", err);
            } finally {
                setLoadingArticles(false);
            }
        })();

        return () => { cancelled = true; };
    }, [activeCategory, userId]);

    // Fetch community writings (analysis_texts) and user's saved library
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingCommunity(true);
            try {
                const data = await prefetchQuery('theory:community', async () => {
                    const { data, error } = await supabase
                        .from('analysis_texts')
                        .select('id, slug, primary_language, metadata, category, tags, created_at')
                        .eq('is_published', true)
                        .order('created_at', { ascending: false });
                    if (error) throw error;
                    return data || [];
                });
                if (cancelled) return;
                setCommunityTexts(data);

                // Fetch user's saved texts
                if (userId && userId !== 'dev-admin') {
                    const saved = await prefetchQuery(`theory:communitylib:${userId}`, async () => {
                        const { data, error } = await supabase
                            .from('user_analysis_library')
                            .select('text_id')
                            .eq('user_id', userId);
                        if (error) throw error;
                        return data || [];
                    });
                    if (cancelled) return;
                    setSavedTextIds(new Set(saved.map(s => s.text_id)));
                }
            } catch (err) {
                console.error('Error fetching community texts:', err);
            } finally {
                setLoadingCommunity(false);
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    const handleSaveToAnalysis = useCallback(async (textId) => {
        if (!user || user.id === 'dev-admin') return;
        setSavingTextId(textId);

        try {
            const isSaved = savedTextIds.has(textId);
            if (isSaved) {
                const { error } = await supabase
                    .from('user_analysis_library')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('text_id', textId);
                if (error) throw error;
                setSavedTextIds(prev => {
                    const next = new Set(prev);
                    next.delete(textId);
                    return next;
                });
            } else {
                const { error } = await supabase
                    .from('user_analysis_library')
                    .insert({ user_id: user.id, text_id: textId });
                if (error) throw error;
                setSavedTextIds(prev => new Set([...prev, textId]));
            }
            // Keep the cache honest for the next mount
            invalidateQuery(`theory:communitylib:${user.id}`);
        } catch (err) {
            console.error('Error toggling save:', err);
            alert('Failed to update your analysis library.');
        } finally {
            setSavingTextId(null);
        }
    }, [user, savedTextIds]);

    const filteredCommunityTexts = useMemo(() => {
        if (!searchQuery) return communityTexts;
        const query = searchQuery.toLowerCase();
        return communityTexts.filter(text => {
            const meta = text.metadata?.[text.primary_language] || text.metadata?.en || {};
            const title = meta.title?.toLowerCase() || '';
            const authors = (meta.authors || []).join(' ').toLowerCase();
            return title.includes(query) || authors.includes(query);
        });
    }, [communityTexts, searchQuery]);

    // Memoize collections to avoid re-computation on every render
    const filteredArticles = useMemo(() => {
        if (!searchQuery) return articles;
        return articles.filter(article => 
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [articles, searchQuery]);

    const collections = useMemo(() => {
        const allCollections = filteredArticles.reduce((acc, article) => {
            if (article.collection) {
                if (!acc[article.collection]) {
                    acc[article.collection] = [];
                }
                acc[article.collection].push(article);
            }
            return acc;
        }, {});
        return Object.entries(allCollections);
    }, [articles]);

    const featuredArticles = useMemo(() => filteredArticles.filter(a => a.is_featured), [filteredArticles]);

    const handleBookmarkToggle = async (articleId, isBookmarked) => {
        if (!user || user.id === 'dev-admin') return;

        try {
            if (isBookmarked) {
                // Delete bookmark
                const { error } = await supabase
                    .from('user_article_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('article_id', articleId);
                if (error) throw error;
            } else {
                // Add bookmark
                const { error } = await supabase
                    .from('user_article_bookmarks')
                    .insert({ user_id: user.id, article_id: articleId });
                if (error) throw error;
            }

            // Update UI
            setArticles(articles.map(a => 
                a.id === articleId ? { ...a, isBookmarked: !isBookmarked } : a
            ));
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            alert('Failed to update bookmark.');
        }
    };

    const renderArticleCard = (article) => (
        <div key={article.id} className={s.card}>
            <Link href={`/theory/article/${article.slug}`} style={{ flexGrow: 1 }}>
                <h3 className={s.cardTitle}>{article.title}</h3>
                <p className={s.cardExcerpt}>{article.excerpt}</p>
            </Link>
            <div className={s.cardFooter}>
                <span className={s.cardMeta}>{article.estimated_time_min} min read</span>
                <div className={s.cardActions}>
                    <div className={s.progressBar}>
                        <div className={s.progressFill} style={{ width: `${article.progress || 0}%` }} />
                    </div>
                    {user && (
                        <button onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(article.id, article.isBookmarked); }} className={`${s.bookmarkBtn} ${article.isBookmarked ? s.bookmarkActive : ''}`}>
                            <Bookmark size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className={s.page}>
            <main className={s.main}>
                <PageHeader
                    kicker="Theory"
                    title="Revolutionary Theory"
                    note="Foundational texts, reading guides, and study material, organised by category."
                />
                <div className={s.topBar}>
                    <div className={s.searchWrap}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search articles...'
                            className={s.searchInput}
                        />
                        <Search size={18} className={s.searchIcon} />
                    </div>
                </div>
                <div className={s.grid}>
                    {/* Left Sidebar for Categories */}
                    <aside className={s.sidebar}>
                        <div className={s.sidePanel}>
                            <h2 className={s.sidePanelTitle}>Categories</h2>
                            {loadingCategories ? (
                                <p>Loading categories...</p>
                            ) : (
                                <div className={s.catStack}>
                                    {categories.map(category => (
                                        <button
                                            key={category.id}
                                            onClick={() => setActiveCategory(category.id)}
                                            className={`${s.catButton} ${activeCategory === category.id ? s.catButtonActive : ''}`}
                                        >
                                            <span>{category.name}</span>
                                            {activeCategory === category.id && <ChevronRight size={14} className={s.catChevron} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <section className={s.contentArea}>
                        {loadingArticles ? (
                            <p>Loading articles...</p>
                        ) : error ? (
                            <p className={s.errorText}>Error: {error}</p>
                        ) : (
                            <>
                                {featuredArticles.length > 0 && (
                                    <div className={s.featuredBlock}>
                                        <h2 className={s.blockTitle}>Featured Materials</h2>
                                        <div className={s.cardGrid}>
                                            {featuredArticles.map(renderArticleCard)}
                                        </div>
                                    </div>
                                )}

                                {collections.map(([collectionName, collectionArticles]) => (
                                    <div key={collectionName} className={s.collectionBlock}>
                                        <h3 className={s.blockTitle}>{collectionName}</h3>
                                        <div className={s.cardGrid}>
                                            {collectionArticles.map(renderArticleCard)}
                                        </div>
                                    </div>
                                ))}

                                {articles.length === 0 && !loadingArticles && (
                                    <div className={s.emptyBlock}>
                                        <h3 className={s.emptyTitle}>No Articles Found</h3>
                                        <p className={s.emptyText}>There are no articles in this category yet.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>

                {/* Community Writings Section */}
                <div className={s.communitySection}>
                    <div className={s.communityHeader}>
                        <div className={s.communityTitleRow}>
                            <BookOpen size={28} className={s.communityIcon} />
                            <h2 className={s.blockTitle}>Community Writings</h2>
                        </div>
                        {isAdmin && isAdmin() && (
                            <button onClick={() => router.push('/admin/analysis/upload')} className={s.uploadBtn}>
                                <Plus size={16} />
                                Upload Text
                            </button>
                        )}
                    </div>

                    {loadingCommunity ? (
                        <div className={s.loadingCenter}>
                            <Loader2 size={28} className={s.spinner} />
                        </div>
                    ) : filteredCommunityTexts.length === 0 ? (
                        <div className={s.emptyBlock}>
                            <BookOpen size={40} style={{ margin: '0 auto 12px', color: 'var(--textFaint)' }} />
                            <h3 className={s.emptyTitle}>No Community Texts Yet</h3>
                            <p className={s.emptyText}>Community writings will appear here once uploaded.</p>
                        </div>
                    ) : (
                        <div className={s.communityGrid}>
                            {filteredCommunityTexts.map(text => {
                                const meta = text.metadata?.[text.primary_language] || text.metadata?.en || {};
                                const isSaved = savedTextIds.has(text.id);
                                const isSaving = savingTextId === text.id;
                                return (
                                    <div key={text.id} className={s.communityCard}>
                                        <Link href={`/analysis/text/${text.slug}?mode=read`} style={{ flexGrow: 1 }}>
                                            <h3 className={s.communityCardTitle}>{meta.title || 'Untitled'}</h3>
                                            {meta.authors?.length > 0 && (
                                                <p className={s.communityAuthors}>
                                                    <User size={14} />
                                                    {meta.authors.join(', ')}
                                                </p>
                                            )}
                                            {text.category && (
                                                <span className={s.communityTag}>{text.category}</span>
                                            )}
                                        </Link>
                                        <div className={s.communityFooter}>
                                            <span className={s.communityDate}>
                                                <Calendar size={12} />
                                                {new Date(text.created_at).toLocaleDateString()}
                                            </span>
                                            {user && user.id !== 'dev-admin' && (
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveToAnalysis(text.id); }}
                                                    disabled={isSaving}
                                                    className={`${s.saveBtn} ${isSaved ? s.saveBtnSaved : ''}`}
                                                    title={isSaved ? 'Remove from Analysis' : 'Save to Analysis'}
                                                >
                                                    {isSaving ? (
                                                        <Loader2 size={14} />
                                                    ) : isSaved ? (
                                                        <><Check size={14} /> Saved</>
                                                    ) : (
                                                        <><Send size={14} /> Save to Analysis</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TheoryPage;