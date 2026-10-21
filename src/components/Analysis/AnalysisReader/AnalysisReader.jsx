import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Users, MessageSquare, Bookmark, Highlighter, Link2, BarChart3, Trash2, BookOpen } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../supabaseClient';
import useAnalysisText from '../hooks/useAnalysisText';
import useAnalysisComments from '../hooks/useAnalysisComments';
import useAnalysisBookmarks from '../hooks/useAnalysisBookmarks';
import useAnalysisHighlights from '../hooks/useAnalysisHighlights';
import useAnalysisPresence from '../hooks/useAnalysisPresence';
import TableOfContents from './TableOfContents';
import TextMetadata from './TextMetadata';
import SectionRenderer from './SectionRenderer';
import ReadingProgress from './ReadingProgress';
import TextSelectionPopup from './TextSelectionPopup';
import { SectionComments } from '../AnalysisComments';
import { TextAnalysisPanel, CrossReferencesPanel } from '../AnalysisTools';
import useCrossReferences from '../hooks/useCrossReferences';
import GlossaryPopup from '../../GlossaryPopup';
import { buildGlossaryIndex } from './glossifyHtml';
import * as rs from './AnalysisReader.css.ts';

const AnalysisReader = () => {
    const { slug } = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isAdmin } = useAuth();
    const [viewMode, setViewMode] = useState(searchParams.get('mode') === 'read' ? 'reading' : 'analysis');
    const isReadingMode = viewMode === 'reading';
    const [glossaryIndex, setGlossaryIndex] = useState(null);
    const [glossaryTerm, setGlossaryTerm] = useState(null);
    const glossaryLookupRef = useRef(null);

    /* Glossary layer — fetch once, index the terms, annotate every section */
    useEffect(() => {
        let cancelled = false;
        const fetchGlossary = async () => {
            try {
                const { data, error } = await supabase.from('glossary').select('term, type, explanation, url');
                if (error || cancelled || !Array.isArray(data)) return;
                const index = buildGlossaryIndex(data);
                glossaryLookupRef.current = index?.byLower || null;
                setGlossaryIndex(index);
            } catch (err) {
                console.error('Error fetching glossary:', err);
            }
        };
        fetchGlossary();
        return () => { cancelled = true; };
    }, []);

    const handleGlossaryClick = useCallback((event) => {
        const target = event.target.closest?.('.ar-gloss-term');
        if (!target) return;
        const key = target.getAttribute('data-gloss-term')?.toLowerCase();
        const entry = key ? glossaryLookupRef.current?.get(key) : null;
        if (entry) setGlossaryTerm(entry);
    }, []);

    const toggleViewMode = useCallback(() => {
        const newMode = isReadingMode ? 'analysis' : 'reading';
        setViewMode(newMode);
        const next = new URLSearchParams();
        if (newMode === 'reading') next.set('mode', 'read');
        router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname);
    }, [isReadingMode, pathname, router]);
    const {
        text,
        loading,
        error,
        currentLanguage,
        availableLanguages,
        metadata,
        tableOfContents,
        getLocalizedSection,
        switchLanguage,
    } = useAnalysisText(slug);

    const {
        comments,
        loading: commentsLoading,
        addComment,
        deleteComment,
        updateComment,
        getCommentCountBySection,
    } = useAnalysisComments(text?.id);

    const {
        bookmarks,
        toggleBookmark,
        isBookmarked,
    } = useAnalysisBookmarks(text?.id);

    const {
        highlights,
        addHighlight,
        removeHighlight,
        getHighlightsForSection,
    } = useAnalysisHighlights(text?.id);

    const {
        activeUsers,
        updateSection: updatePresenceSection,
    } = useAnalysisPresence(text?.id);

    const {
        outgoingRefs,
        incomingRefs,
        loading: refsLoading,
        createReference,
        deleteReference,
    } = useCrossReferences(text?.id);

    const [activeSection, setActiveSection] = useState(null);
    const [activeTab, setActiveTab] = useState('comments');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [filterSection, setFilterSection] = useState(null);
    const [analyzeText, setAnalyzeText] = useState('');
    const sectionRefs = useRef({});
    const contentRef = useRef(null);
    
    const commentCounts = getCommentCountBySection();

    // Scroll spy to track active section
    useEffect(() => {
        if (!text?.sections) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.id.replace('section-', '');
                        setActiveSection(sectionId);
                    }
                });
            },
            { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
        );

        Object.values(sectionRefs.current).forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [text?.sections]);

    const scrollToSection = useCallback((sectionId) => {
        const element = document.getElementById(`section-${sectionId}`);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
            setActiveSection(sectionId);
        }
    }, []);

    const handleCommentClick = useCallback((sectionId) => {
        setActiveTab('comments');
        setFilterSection(sectionId);
        setSidebarOpen(true);
    }, []);

    const handleBookmarkClick = useCallback(async (sectionId) => {
        await toggleBookmark(sectionId);
    }, [toggleBookmark]);

    const handleCrossRefClick = useCallback((sectionId) => {
        setActiveTab('crossrefs');
        setSidebarOpen(true);
    }, []);

    // Text selection popup handlers
    const handleSelectionHighlight = useCallback(async ({ sectionId, text, color, note }) => {
        await addHighlight(sectionId, text, null, note, color);
        setActiveTab('highlights');
    }, [addHighlight]);

    const handleSelectionComment = useCallback(async ({ sectionId, text, comment }) => {
        const prefixedComment = `"${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"\n\n${comment}`;
        await addComment(sectionId, prefixedComment);
        setFilterSection(sectionId);
        setActiveTab('comments');
    }, [addComment]);

    const handleSelectionAnalyze = useCallback((text) => {
        setAnalyzeText(text);
        setActiveTab('analysis');
    }, []);

    const handleDeleteText = async () => {
        if (!window.confirm('Are you sure you want to delete this text? This action cannot be undone.')) {
            return;
        }
        try {
            const { error: deleteError } = await supabase
                .from('analysis_texts')
                .delete()
                .eq('id', text.id);
            
            if (deleteError) throw deleteError;
            router.push('/analysis');
        } catch (err) {
            console.error('Error deleting text:', err);
            alert('Failed to delete text: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className={rs.loadingWrap}>
                <Loader2 className="w-12 h-12 animate-spin text-[color:var(--red-bright)]" />
            </div>
        );
    }

    if (error || !text) {
        return (
            <div className={rs.page}>
                <div className={rs.errorWrap}>
                    <h2 className={rs.errorTitle}>Text Not Found</h2>
                    <p className={rs.errorText}>{error || 'The requested text could not be loaded.'}</p>
                    <button onClick={() => router.push('/analysis')} className={rs.errorLink}>
                        Back to Analysis
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'comments', label: 'Comments', icon: MessageSquare },
        { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
        { id: 'highlights', label: 'Highlights', icon: Highlighter },
        { id: 'analysis', label: 'Analysis', icon: BarChart3 },
        { id: 'crossrefs', label: 'Cross-Refs', icon: Link2 },
    ];

    return (
        <div className={rs.page}>
            <ReadingProgress />

            {/* Back button and admin delete */}
            <div className="fixed top-20 left-4 z-30 flex gap-2">
                <button
                    onClick={() => router.push('/analysis')}
                    className="p-2 border border-[color:var(--line)] bg-[color:var(--ink)] hover:border-[color:var(--red-bright)] transition-colors flex items-center gap-2 text-sm text-[color:var(--paper-dim)]"
                >
                    <ArrowLeft size={18} />
                    <span className="hidden md:inline">Back</span>
                </button>
                {isAdmin && isAdmin() && (
                    <button
                        onClick={handleDeleteText}
                        className="p-2 border border-[color:var(--line)] bg-[color:var(--ink)] hover:border-[color:var(--red-bright)] transition-colors flex items-center gap-2 text-sm text-[color:var(--paper-dim)] hover:text-[color:var(--red-bright)]"
                        title="Delete this text"
                    >
                        <Trash2 size={18} />
                        <span className="hidden md:inline">Delete</span>
                    </button>
                )}
            </div>

            <div className={rs.stage}>
                {/* Mode strip */}
                <div className={rs.modeStrip}>
                    <div className="flex items-center gap-2">
                        {isReadingMode ? (
                            <BookOpen size={15} className={rs.modeLabel} />
                        ) : (
                            <BarChart3 size={15} className={rs.modeLabel} />
                        )}
                        <span className={rs.modeLabel}>{isReadingMode ? 'Reading Mode' : 'Analysis Mode'}</span>
                        <span className={rs.modeNote}>
                            {isReadingMode ? '— focused, distraction-free reading' : '— comments, highlights, cross-references & deep analysis'}
                        </span>
                    </div>
                    <button onClick={toggleViewMode} className={rs.modeToggle}>
                        {isReadingMode ? <><BarChart3 size={13} /> Switch to Analysis</> : <><BookOpen size={13} /> Switch to Reading</>}
                    </button>
                </div>

                <div className={`${rs.stageGrid} ${isReadingMode ? rs.readingGrid : rs.analysisGrid}`}>
                    {/* Left Sidebar - TOC */}
                    <aside className={rs.sideRail}>
                        <div className={rs.sticky}>
                            <TableOfContents
                                items={tableOfContents}
                                activeSection={activeSection}
                                onSectionClick={scrollToSection}
                            />

                            {/* Active viewers - analysis mode only */}
                            {!isReadingMode && <div className="mt-4 p-4 border border-[color:var(--line-soft)]">
                                <h4 className="text-sm font-medium text-[color:var(--paper-dim)] mb-2 flex items-center gap-2">
                                    <Users size={14} />
                                    Active Readers ({activeUsers.length + 1})
                                </h4>
                                <div className="flex -space-x-2">
                                    <div
                                        className="w-8 h-8 rounded-full bg-[color:var(--red)] border-2 border-[color:var(--ink)] flex items-center justify-center text-xs font-medium"
                                        title="You"
                                    >
                                        You
                                    </div>
                                    {activeUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="w-8 h-8 rounded-full bg-[color:var(--ink-3)] border-2 border-[color:var(--ink)] flex items-center justify-center text-xs overflow-hidden"
                                            title={`${user.username}${user.section_id ? ` (§${user.section_id})` : ''}`}
                                        >
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                user.username?.charAt(0).toUpperCase() || '?'
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className={rs.column}>
                        <TextMetadata
                            metadata={metadata}
                            currentLanguage={currentLanguage}
                            availableLanguages={availableLanguages}
                            onLanguageChange={switchLanguage}
                        />

                        {/* Sections */}
                        <div ref={contentRef} className={rs.content} onClick={handleGlossaryClick}>
                            <TextSelectionPopup
                                containerRef={contentRef}
                                onHighlight={handleSelectionHighlight}
                                onComment={handleSelectionComment}
                                onAnalyze={handleSelectionAnalyze}
                                currentSectionId={activeSection}
                            />
                            {text.sections?.map((section) => {
                                const localizedSection = getLocalizedSection(section);
                                return (
                                    <SectionRenderer
                                        key={section.id}
                                        ref={(el) => (sectionRefs.current[section.id] = el)}
                                        section={localizedSection}
                                        isActive={activeSection === section.id}
                                        commentCount={commentCounts[section.id] || 0}
                                        isBookmarked={isBookmarked(section.id)}
                                        onCommentClick={handleCommentClick}
                                        onBookmarkClick={handleBookmarkClick}
                                        onCrossRefClick={handleCrossRefClick}
                                        readingMode={isReadingMode}
                                        glossaryIndex={glossaryIndex}
                                    />
                                );
                            })}
                        </div>
                    </main>

                    {/* Right Sidebar - Tools (analysis mode only) */}
                    {!isReadingMode && <aside className={rs.sideRail}>
                        <div className={rs.sticky}>
                            {/* Tab Navigation */}
                            <div className={rs.railTabs}>
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`${rs.railTab} ${activeTab === tab.id ? rs.railTabActive : ''}`}
                                    >
                                        <tab.icon size={16} />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className={`${rs.railPanel} max-h-[calc(100vh-280px)] overflow-y-auto`}>
                                {activeTab === 'comments' && (
                                    <div>
                                        {filterSection && (
                                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
                                                <span className="text-sm text-gray-400">
                                                    Showing comments for §{filterSection}
                                                </span>
                                                <button 
                                                    onClick={() => setFilterSection(null)}
                                                    className="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Show all
                                                </button>
                                            </div>
                                        )}
                                        <SectionComments
                                            comments={comments}
                                            loading={commentsLoading}
                                            sectionId={filterSection}
                                            onAddComment={addComment}
                                            onDeleteComment={deleteComment}
                                            onUpdateComment={updateComment}
                                        />
                                    </div>
                                )}
                                {activeTab === 'bookmarks' && (
                                    <div>
                                        <h4 className="font-medium text-white flex items-center gap-2 mb-4">
                                            <Bookmark size={16} className="text-red-500" />
                                            Your Bookmarks
                                        </h4>
                                        {bookmarks.length === 0 ? (
                                            <div className="text-gray-400 text-center py-8">
                                                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p className="text-sm">No bookmarks yet</p>
                                                <p className="text-xs mt-1 opacity-70">Click the bookmark icon on any section</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {bookmarks.map(bookmark => (
                                                    <button
                                                        key={bookmark.id}
                                                        onClick={() => scrollToSection(bookmark.section_id)}
                                                        className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 rounded-none transition-colors"
                                                    >
                                                        <div className="text-sm text-white">§{bookmark.section_id}</div>
                                                        {bookmark.note && (
                                                            <p className="text-xs text-gray-400 mt-1 truncate">{bookmark.note}</p>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'highlights' && (
                                    <div>
                                        <h4 className="font-medium text-white flex items-center gap-2 mb-4">
                                            <Highlighter size={16} className="text-red-500" />
                                            Your Highlights
                                        </h4>
                                        {highlights.length === 0 ? (
                                            <div className="text-gray-400 text-center py-8">
                                                <Highlighter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p className="text-sm">No highlights yet</p>
                                                <p className="text-xs mt-1 opacity-70">Select text in any section to highlight</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {highlights.map(highlight => (
                                                    <div
                                                        key={highlight.id}
                                                        className="p-3 bg-gray-800/50 rounded-none border-l-4"
                                                        style={{ borderColor: highlight.color === 'yellow' ? '#facc15' : highlight.color === 'green' ? '#2d8a4e' : highlight.color === 'blue' ? '#4a7fb5' : highlight.color === 'pink' ? '#d41f3d' : '#c8860a' }}
                                                    >
                                                        <p className="text-sm text-gray-300 italic">"{highlight.selected_text}"</p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-xs text-gray-500">§{highlight.section_id}</span>
                                                            <button
                                                                onClick={() => removeHighlight(highlight.id)}
                                                                className="text-xs text-gray-500 hover:text-red-400"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'analysis' && (
                                    <TextAnalysisPanel 
                                        text={text} 
                                        currentLanguage={currentLanguage}
                                        selectedText={analyzeText}
                                    />
                                )}
                                {activeTab === 'crossrefs' && (
                                    <CrossReferencesPanel
                                        textId={text?.id}
                                        outgoingRefs={outgoingRefs}
                                        incomingRefs={incomingRefs}
                                        loading={refsLoading}
                                        onCreateReference={createReference}
                                        onDeleteReference={deleteReference}
                                        currentSectionId={activeSection}
                                    />
                                )}
                            </div>
                        </div>
                    </aside>}
                </div>
            </div>

            {/* Mobile Bottom Navigation (analysis mode only) */}
            {!isReadingMode && <div className={rs.mobileBar}>
                <div className="flex justify-around w-full p-1">
                    {tabs.slice(0, 4).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSidebarOpen(true);
                            }}
                            className={`${rs.mobileBarBtn} ${activeTab === tab.id ? rs.mobileBarBtnActive : ''}`}
                        >
                            <tab.icon size={20} />
                        </button>
                    ))}
                </div>
            </div>}

            {/* Glossary popup — opened by clicking an annotated term */}
            <GlossaryPopup term={glossaryTerm} onClose={() => setGlossaryTerm(null)} />
        </div>
    );
};

export default AnalysisReader;
