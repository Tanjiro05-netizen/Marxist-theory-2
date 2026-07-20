import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePathname, useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import Mark from 'mark.js';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import ArticleComments from '../components/ArticleComments';
import HighlightHandler from '../components/HighlightHandler';
import TableOfContents from '../components/TableOfContents';
import HighlightsSidebar from '../components/HighlightsSidebar';
import NerRenderer from '../components/NerRenderer';
import StudySidebar from '../components/Reader/StudySidebar';
import * as s from './ArticleReaderPage.css.ts';
import PassageFinder from '../components/Reader/PassageFinder';
import ConceptMapPanel from '../components/Reader/ConceptMapPanel';
import { extractPassages, buildPassageResults, buildConceptGraphData } from '../utils/readerInsights';
import { Loader, Bookmark, MessageSquare, List, Check, Share2, Search, X, ChevronUp, ChevronDown, Download, BarChart3, BookOpen } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ArticleReaderPage = () => {
    const { slug } = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    
    const [article, setArticle] = useState(null);
    const [entities, setEntities] = useState({ people: [], places: [], organizations: [] });
    const [highlights, setHighlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const contentRef = useRef(null);
    const progressToSave = useRef(0);

    // UI State
    const [isTocOpen, setIsTocOpen] = useState(true);
    const [isHighlightsOpen, setIsHighlightsOpen] = useState(true);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(-1);
    const [showCopied, setShowCopied] = useState(false);
    const markInstance = useRef(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [readingMode, setReadingMode] = useState('study');
    const [isPassageFinderOpen, setIsPassageFinderOpen] = useState(false);
    const [isConceptMapOpen, setIsConceptMapOpen] = useState(false);
    const [passageQuery, setPassageQuery] = useState('');
    const [glossaryTerms, setGlossaryTerms] = useState([]);

    const articlePassages = useMemo(() => extractPassages(article?.content || ''), [article?.content]);

    const studyConcepts = useMemo(() => {
        if (!article?.content || !glossaryTerms.length) return [];
        const lowerContent = article.content.toLowerCase();
        return glossaryTerms
            .filter((entry) => lowerContent.includes(entry.term.toLowerCase()))
            .slice(0, 16);
    }, [article?.content, glossaryTerms]);

    const derivedEntities = useMemo(() => {
        if (!article?.content || !glossaryTerms.length) return { people: [], places: [], organizations: [] };

        const lowerContent = article.content.toLowerCase();
        const matchesByType = (type) => glossaryTerms
            .filter((entry) => entry.type === type && lowerContent.includes(entry.term.toLowerCase()))
            .map((entry) => entry.term)
            .slice(0, 24);

        return {
            people: matchesByType('person'),
            places: matchesByType('place'),
            organizations: matchesByType('organization')
        };
    }, [article?.content, glossaryTerms]);

    const rankedPassages = useMemo(() => {
        return buildPassageResults({
            passages: articlePassages,
            query: passageQuery,
            glossaryTerms: studyConcepts
        });
    }, [articlePassages, passageQuery, studyConcepts]);

    const conceptGraphData = useMemo(() => {
        return buildConceptGraphData({ passages: articlePassages, glossaryTerms: studyConcepts });
    }, [articlePassages, studyConcepts]);

    const progressMilestone = useMemo(() => {
        if (scrollProgress >= 100) return 'Done';
        if (scrollProgress >= 75) return '75% checkpoint';
        if (scrollProgress >= 50) return '50% checkpoint';
        if (scrollProgress >= 25) return '25% checkpoint';
        return 'Start';
    }, [scrollProgress]);

    const isStudyMode = readingMode === 'study';

    const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const windowHeight = scrollHeight - clientHeight;
        const currentProgress = windowHeight > 0 ? (scrollTop / windowHeight) * 100 : 0;
        setScrollProgress(currentProgress);
        progressToSave.current = Math.round(currentProgress);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const storedMode = localStorage.getItem('reader_mode');
        if (storedMode === 'study' || storedMode === 'focus') {
            setReadingMode(storedMode);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('reader_mode', readingMode);
    }, [readingMode]);

    useEffect(() => {
        const fetchGlossaryTerms = async () => {
            const { data, error: glossaryError } = await supabase
                .from('glossary')
                .select('term, type, explanation')
                .order('term', { ascending: true });

            if (glossaryError) {
                console.error('Error fetching glossary terms:', glossaryError);
                return;
            }
            setGlossaryTerms(data || []);
        };

        fetchGlossaryTerms();
    }, []);

    const fetchArticleAndHighlights = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: articleData, error: articleError } = await supabase
                .from('theory_articles')
                .select('*')
                .eq('slug', slug)
                .maybeSingle();

            if (articleError) throw articleError;
            if (!articleData) throw new Error('Article not found. Please select an article from the Theory page.');

            console.log('Fetched article content:', articleData.content);

            setArticle(articleData);

            setEntities(derivedEntities);

            if (user && articleData && user.id !== 'dev-admin') {
                const { data: highlightsData, error: highlightsError } = await supabase
                    .from('user_article_highlights')
                    .select('*').eq('user_id', user.id).eq('article_id', articleData.id)
                    .order('created_at', { ascending: true });

                if (highlightsError) throw highlightsError;
                setHighlights(highlightsData || []);

                const { data: bookmarkData, error: bookmarkError } = await supabase
                    .from('user_article_bookmarks').select('*')
                    .eq('user_id', user.id).eq('article_id', articleData.id)
                    .maybeSingle();
                
                if (bookmarkError) throw bookmarkError;
                setIsBookmarked(!!bookmarkData);

                const { data: progressData, error: progressError } = await supabase
                    .from('user_article_progress').select('progress_percentage')
                    .eq('user_id', user.id).eq('article_id', articleData.id)
                    .maybeSingle();
                if (progressError) {
                    console.error('Error fetching article progress:', progressError);
                }
                if (progressData) {
                    const initialScroll = (document.documentElement.scrollHeight - document.documentElement.clientHeight) * (progressData.progress_percentage / 100);
                    window.scrollTo(0, initialScroll);
                }
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [slug, user, derivedEntities]);

    useEffect(() => {
        fetchArticleAndHighlights();
    }, [fetchArticleAndHighlights]);

    useEffect(() => {
        if (contentRef.current) {
            markInstance.current = new Mark(contentRef.current);
        }
    }, [article]);

    useEffect(() => {
        if (!contentRef.current || !articlePassages.length) return;
        const paragraphs = Array.from(contentRef.current.querySelectorAll('p'));
        let passageIndex = 0;

        paragraphs.forEach((paragraph) => {
            const text = paragraph.textContent?.trim() || '';
            if (text.length < 40 || passageIndex >= articlePassages.length) return;
            paragraph.setAttribute('data-passage-id', articlePassages[passageIndex].id);
            passageIndex += 1;
        });
    }, [articlePassages, article]);

    useEffect(() => {
        const passageFromUrl = searchParams.get('passage');
        if (!passageFromUrl || !contentRef.current) return;

        const target = contentRef.current.querySelector(`[data-passage-id="${passageFromUrl}"]`);
        if (!target) return;

        target.classList.add('current-search-highlight');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const timer = setTimeout(() => {
            target.classList.remove('current-search-highlight');
        }, 1800);

        return () => clearTimeout(timer);
    }, [searchParams, article]);

    useEffect(() => {
        const conceptFromUrl = searchParams.get('concept');
        if (!conceptFromUrl) return;
        setPassageQuery(conceptFromUrl);
        setIsPassageFinderOpen(true);
    }, [searchParams]);

    const performSearch = useCallback(() => {
        if (!markInstance.current) return;
        if (!searchQuery || searchQuery.length < 2) {
            markInstance.current.unmark();
            setSearchResults([]);
            setCurrentResultIndex(-1);
            return;
        }

        markInstance.current.unmark({
            done: () => {
                markInstance.current.mark(searchQuery, {
                    className: 'search-highlight',
                    acrossElements: true,
                    done: (count) => {
                        const highlightedElements = contentRef.current.querySelectorAll('.search-highlight');
                        setSearchResults(Array.from(highlightedElements));
                        setCurrentResultIndex(count > 0 ? 0 : -1);
                    }
                });
            }
        });
    }, [searchQuery]);

    useEffect(() => {
        const handler = setTimeout(() => performSearch(), 300);
        return () => clearTimeout(handler);
    }, [searchQuery, performSearch]);

    useEffect(() => {
        searchResults.forEach((el, index) => {
            el.classList.remove('current-search-highlight');
            if (index === currentResultIndex) {
                el.classList.add('current-search-highlight');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }, [currentResultIndex, searchResults]);

    const handleNextResult = () => {
        if (searchResults.length > 0) {
            setCurrentResultIndex((prev) => (prev + 1) % searchResults.length);
        }
    };

    const handlePrevResult = () => {
        if (searchResults.length > 0) {
            setCurrentResultIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
        }
    };

    const jumpToPassage = useCallback((passage) => {
        if (!contentRef.current || !passage?.id) return;

        const el = contentRef.current.querySelector(`[data-passage-id="${passage.id}"]`);
        if (!el) return;

        el.classList.add('current-search-highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const next = new URLSearchParams(searchParams.toString());
        next.set('passage', passage.id);
        router.push(`${pathname}?${next.toString()}`);

        setTimeout(() => el.classList.remove('current-search-highlight'), 1800);
    }, [pathname, router, searchParams]);

    const handleStudyConceptSelect = (concept) => {
        setPassageQuery(concept.term);
        setIsPassageFinderOpen(true);
    };

    const handleConceptNodeClick = (node) => {
        if (!node) return;
        if (node.type === 'heading' && node.passageId) {
            jumpToPassage({ id: node.passageId });
            return;
        }
        if (node.type === 'concept' && node.concept) {
            setPassageQuery(node.concept);
            setIsPassageFinderOpen(true);
            const next = new URLSearchParams(searchParams.toString());
            next.set('concept', node.concept);
            router.push(`${pathname}?${next.toString()}`);
        }
    };

    useEffect(() => {
        return () => {
            if (user && article && progressToSave.current > 0 && user.id !== 'dev-admin') {
                supabase.from('user_article_progress').upsert({
                    user_id: user.id,
                    article_id: article.id,
                    progress_percentage: Math.min(100, progressToSave.current)
                }, { onConflict: 'user_id, article_id' }).then();
            }
        };
    }, [user, article]);

    const handleToggleBookmark = async () => {
        if (!user || !article || user.id === 'dev-admin') return;
        console.log('Toggling bookmark. Current state:', isBookmarked);
        try {
            if (isBookmarked) {
                const { error } = await supabase.from('user_article_bookmarks')
                    .delete().eq('user_id', user.id).eq('article_id', article.id);
                if (error) throw error;
                setIsBookmarked(false);
                console.log('Bookmark removed.');
            } else {
                const { error } = await supabase.from('user_article_bookmarks')
                    .insert({ user_id: user.id, article_id: article.id });
                if (error) throw error;
                setIsBookmarked(true);
                console.log('Bookmark added.');
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: article.title, text: article.excerpt || '', url: window.location.href });
            } else {
                throw new Error('Web Share API not supported');
            }
        } catch (err) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            });
        }
    };

    const handleDownloadPdf = async () => {
        if (!contentRef.current || isGeneratingPdf) return;
        setIsGeneratingPdf(true);
        try {
            const canvas = await html2canvas(contentRef.current, {
                scale: 2, backgroundColor: '#12131A', useCORS: true,
                onclone: (doc) => { doc.querySelectorAll('.no-pdf').forEach(el => el.style.display = 'none'); }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }
            pdf.save(`${article.slug}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleAddHighlight = async (newHighlight) => {
        if (!user || !article || user.id === 'dev-admin') return;
        try {
            const { data, error } = await supabase.from('user_article_highlights')
                .insert({ ...newHighlight, user_id: user.id, article_id: article.id })
                .select().single();
            if (error) throw error;
            setHighlights(prev => [...prev, data]);
        } catch (err) {
            console.error('Error saving highlight:', err);
        }
    };

    const handleDeleteHighlight = async (highlightId) => {
        try {
            const { error } = await supabase.from('user_article_highlights').delete().eq('id', highlightId);
            if (error) throw error;
            setHighlights(prev => prev.filter(h => h.id !== highlightId));
        } catch (err) {
            console.error('Error deleting highlight:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <Loader size={48} className="animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={s.page}>
                <div className="flex flex-col items-center justify-center pt-8 px-4">
                    <p className="text-red-400 text-lg mb-4">{error}</p>
                    <a href="/theory" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                        Browse Theory Articles
                    </a>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <p>Article not found.</p>
            </div>
        );
    }

    return (
        <>
            <div className="fixed top-0 left-0 w-full h-1 z-50 bg-black/30">
                <div
                    className="h-full bg-red-600 transition-all duration-150 ease-linear"
                    style={{ width: `${scrollProgress}%` }}
                ></div>
            </div>

            <main className={`container mx-auto px-4 py-8 ${!isStudyMode ? 'max-w-5xl' : ''}`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    {isStudyMode && (
                        <div className={`lg:col-span-2 transition-all duration-300 ${isTocOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            {isTocOpen && article && <TableOfContents contentRef={contentRef} content={article.content} />}
                        </div>
                    )}

                    <div className={`${isStudyMode ? 'lg:col-span-7' : 'lg:col-span-12'} min-w-0`}>
                        {/* Mode indicator banner */}
                        <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-emerald-900/30 border border-emerald-700/40 rounded-xl no-pdf">
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} className="text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-300">Reading Mode</span>
                                <span className="text-xs text-emerald-500/70 hidden sm:inline">— focused reading with study tools</span>
                            </div>
                            <button
                                onClick={() => router.push(`/analysis/text/${slug}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700/60 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                            >
                                <BarChart3 size={14} />
                                Switch to Analysis
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-700 no-pdf">
                            <div className="flex items-center gap-2">
                                {isStudyMode && (
                                    <button onClick={() => setIsTocOpen(!isTocOpen)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Table of Contents">
                                        <List size={20} />
                                    </button>
                                )}
                                <button onClick={handleToggleBookmark} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Bookmark">
                                    <Bookmark size={20} className={isBookmarked ? 'text-red-500 fill-current' : ''} />
                                </button>
                                <button onClick={() => setIsSearchVisible(!isSearchVisible)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Search">
                                    <Search size={20} />
                                </button>
                                <button onClick={() => setIsPassageFinderOpen((prev) => !prev)} className="px-3 py-1.5 text-xs rounded-full bg-gray-800 hover:bg-gray-700">
                                    Passage Finder
                                </button>
                                <button onClick={() => setIsConceptMapOpen((prev) => !prev)} className="px-3 py-1.5 text-xs rounded-full bg-gray-800 hover:bg-gray-700">
                                    Concept Map
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setReadingMode((prev) => (prev === 'study' ? 'focus' : 'study'))}
                                    className="px-3 py-1.5 text-xs rounded-full bg-red-600/20 text-red-300 hover:bg-red-600/30"
                                >
                                    {isStudyMode ? 'Deep Focus Mode' : 'Study Mode'}
                                </button>
                                {isStudyMode && (
                                    <button onClick={() => setIsHighlightsOpen(!isHighlightsOpen)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Highlights & Comments">
                                        <MessageSquare size={20} />
                                    </button>
                                )}
                                <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Share">
                                    <Share2 size={20} />
                                </button>
                                <button onClick={handleDownloadPdf} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Download PDF">
                                    {isGeneratingPdf ? <Loader size={20} className="animate-spin" /> : <Download size={20} />}
                                </button>
                            </div>
                        </div>

                        {!isStudyMode && (
                            <div className="mb-4 no-pdf">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/70 border border-gray-700 text-xs text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    Progress milestone: {progressMilestone}
                                </div>
                            </div>
                        )}

                        {isSearchVisible && (
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 flex items-center space-x-2 mb-4 no-pdf">
                                <input
                                    type="text"
                                    placeholder="Find in page..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent w-full focus:outline-none"
                                />
                                {searchResults.length > 0 && (
                                    <span className="text-sm text-gray-400">{currentResultIndex + 1} / {searchResults.length}</span>
                                )}
                                <button onClick={handlePrevResult} disabled={searchResults.length === 0} className="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50"><ChevronUp size={16} /></button>
                                <button onClick={handleNextResult} disabled={searchResults.length === 0} className="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50"><ChevronDown size={16} /></button>
                                <button onClick={() => setIsSearchVisible(false)} className="p-1 rounded-full hover:bg-gray-700"><X size={16} /></button>
                            </div>
                        )}

                        <PassageFinder
                            isOpen={isPassageFinderOpen}
                            query={passageQuery}
                            onQueryChange={setPassageQuery}
                            results={rankedPassages}
                            onSelectResult={jumpToPassage}
                            onClose={() => setIsPassageFinderOpen(false)}
                        />

                        {isConceptMapOpen && (
                            <div className="mb-4">
                                <ConceptMapPanel graphData={conceptGraphData} onNodeClick={handleConceptNodeClick} />
                            </div>
                        )}

                        <h1 className="text-4xl font-bold mb-2">{article.title}</h1>
                        <p className="text-lg text-gray-400 mb-6">{article.author}</p>

                        <div ref={contentRef} className={`prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-red-400 hover:prose-a:text-red-500 ${!isStudyMode ? 'prose-lg' : ''}`}>
                            <HighlightHandler
                                highlights={highlights}
                                onAddHighlight={handleAddHighlight}
                            >
                                <NerRenderer entities={entities}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkSlug]} rehypePlugins={[rehypeRaw]}>
                                        {article.content || ''}
                                    </ReactMarkdown>
                                </NerRenderer>
                            </HighlightHandler>
                        </div>

                        <ArticleComments articleId={article.id} />
                    </div>

                    {isStudyMode && isHighlightsOpen && (
                        <div className="lg:col-span-3 space-y-4">
                            <StudySidebar
                                concepts={studyConcepts}
                                highlights={highlights}
                                onSelectConcept={handleStudyConceptSelect}
                                onSelectHighlight={(highlight) => {
                                    setSearchQuery(highlight.selected_text || '');
                                    setIsSearchVisible(true);
                                }}
                            />
                            {user && (
                                <HighlightsSidebar
                                    highlights={highlights}
                                    onDeleteHighlight={handleDeleteHighlight}
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>
            {showCopied && (
                <div className="fixed bottom-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                    <Check size={20} />
                    <span>Link copied to clipboard!</span>
                </div>
            )}
        </>
    );
};

export default ArticleReaderPage;
