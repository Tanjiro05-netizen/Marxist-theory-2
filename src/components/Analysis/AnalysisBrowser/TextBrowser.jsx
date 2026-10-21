import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { 
    Search, Filter, Grid, List, Plus, Loader2, BookOpen, 
    Calendar, User, Globe, Tag, Clock, ChevronDown,
    MessageSquare, Highlighter, Link2, BarChart3, Library
} from 'lucide-react';
import TextCard from './TextCard';

const TextBrowser = () => {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [texts, setTexts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLanguage, setSelectedLanguage] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [browseMode, setBrowseMode] = useState('all');
    const [allTexts, setAllTexts] = useState([]);
    const [savedTextIds, setSavedTextIds] = useState(new Set());

    const categories = useMemo(() => {
        const cats = new Set(texts.map(t => t.category).filter(Boolean));
        return ['all', ...Array.from(cats)];
    }, [texts]);

    const languages = useMemo(() => {
        const langs = new Set(texts.flatMap(t => t.available_languages || []));
        return ['all', ...Array.from(langs)];
    }, [texts]);

    useEffect(() => {
        fetchTexts();
        if (user && user.id !== 'dev-admin') fetchSavedIds();
    }, [user]);

    const handleDeleteText = async (textId) => {
        if (!window.confirm('Are you sure you want to delete this text? This action cannot be undone.')) {
            return;
        }
        try {
            const { error: deleteError } = await supabase
                .from('analysis_texts')
                .delete()
                .eq('id', textId);
            
            if (deleteError) throw deleteError;
            setTexts(prev => prev.filter(t => t.id !== textId));
        } catch (err) {
            console.error('Error deleting text:', err);
            alert('Failed to delete text: ' + err.message);
        }
    };

    const fetchSavedIds = async () => {
        try {
            const { data, error: savedError } = await supabase
                .from('user_analysis_library')
                .select('text_id')
                .eq('user_id', user.id);
            if (savedError) throw savedError;
            setSavedTextIds(new Set(data?.map(s => s.text_id) || []));
        } catch (err) {
            console.error('Error fetching saved IDs:', err);
        }
    };

    const fetchTexts = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('analysis_texts')
                .select(`
                    id,
                    slug,
                    primary_language,
                    available_languages,
                    metadata,
                    category,
                    tags,
                    is_published,
                    created_at,
                    uploaded_by,
                    profiles:uploaded_by(username)
                `)
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setAllTexts(data || []);
            setTexts(data || []);
        } catch (err) {
            console.error('Error fetching texts:', err);
            setError('Failed to load texts');
        } finally {
            setLoading(false);
        }
    };

    const activeTexts = useMemo(() => {
        if (browseMode === 'library') {
            return allTexts.filter(t => savedTextIds.has(t.id));
        }
        return allTexts;
    }, [allTexts, savedTextIds, browseMode]);

    const filteredTexts = useMemo(() => {
        let result = [...activeTexts];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(text => {
                const metadata = text.metadata?.[text.primary_language] || text.metadata?.en || {};
                const title = metadata.title?.toLowerCase() || '';
                const authors = (metadata.authors || []).join(' ').toLowerCase();
                const tags = (text.tags || []).join(' ').toLowerCase();
                return title.includes(query) || authors.includes(query) || tags.includes(query);
            });
        }

        // Category filter
        if (selectedCategory !== 'all') {
            result = result.filter(text => text.category === selectedCategory);
        }

        // Language filter
        if (selectedLanguage !== 'all') {
            result = result.filter(text => 
                text.available_languages?.includes(selectedLanguage)
            );
        }

        // Sort
        result.sort((a, b) => {
            const metaA = a.metadata?.[a.primary_language] || a.metadata?.en || {};
            const metaB = b.metadata?.[b.primary_language] || b.metadata?.en || {};

            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'title':
                    return (metaA.title || '').localeCompare(metaB.title || '');
                case 'year':
                    return (metaB.year || 0) - (metaA.year || 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [activeTexts, searchQuery, selectedCategory, selectedLanguage, sortBy]);

    const LanguageNames = {
        en: 'English',
        de: 'Deutsch',
        fr: 'Français',
        es: 'Español',
        ru: 'Русский',
        zh: '中文',
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-[1380px] mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[color:var(--line)]">
                    <div>
                        <p className="m-0 mb-2 font-[Outfit,sans-serif] text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--red-bright)]">
                            Theory · Close Reading
                        </p>
                        <h1 className="m-0 font-[var(--font-display)] text-[clamp(32px,4vw,48px)] font-medium leading-none text-[color:var(--paper)]">
                            Text Analysis
                        </h1>
                        <p className="mt-3 mb-0 text-sm text-[color:var(--paper-dim)]">
                            Read, annotate, and deeply analyze revolutionary texts
                        </p>
                    </div>
                    <Link href="/theory"
                        className="inline-flex items-center gap-2 min-h-[44px] px-5 border border-[color:var(--line)] hover:border-[color:var(--red-bright)] text-[color:var(--paper-dim)] hover:text-[color:var(--red-bright)] font-[Outfit,sans-serif] text-[11px] uppercase tracking-[0.14em] transition-colors"
                    >
                        <BookOpen size={15} />
                        Browse Theory
                    </Link>
                </header>

                {/* Feature highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {[
                        { icon: MessageSquare, label: 'Section Comments', desc: 'Discuss passages' },
                        { icon: Highlighter, label: 'Highlights & Notes', desc: 'Annotate key ideas' },
                        { icon: Link2, label: 'Cross-References', desc: 'Link related texts' },
                        { icon: BarChart3, label: 'Text Analysis', desc: 'Keyword & concordance tools' },
                    ].map(({ icon: Icon, label, desc }) => (
                        <div key={label} className="border border-[color:var(--line-soft)] p-3 flex items-start gap-3">
                            <Icon size={18} className="text-[color:var(--red-bright)] mt-0.5 shrink-0" />
                            <div>
                                <span className="text-xs font-medium text-[color:var(--paper)]">{label}</span>
                                <span className="block text-[11px] text-[color:var(--paper-faint)]">{desc}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Browse mode toggle */}
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={() => setBrowseMode('all')}
                        className={`px-4 py-2 min-h-[44px] text-sm font-medium border transition-colors ${
                            browseMode === 'all'
                                ? 'bg-[color:var(--red)] text-[#f5f0e6] border-[color:var(--red)]'
                                : 'bg-transparent border-[color:var(--line)] text-[color:var(--paper-dim)] hover:text-[color:var(--paper)]'
                        }`}
                    >
                        All Texts ({allTexts.length})
                    </button>
                    {user && user.id !== 'dev-admin' && (
                        <button
                            onClick={() => setBrowseMode('library')}
                            className={`flex items-center gap-1.5 px-4 py-2 min-h-[44px] text-sm font-medium border transition-colors ${
                                browseMode === 'library'
                                    ? 'bg-[color:var(--red)] text-[#f5f0e6] border-[color:var(--red)]'
                                    : 'bg-transparent border-[color:var(--line)] text-[color:var(--paper-dim)] hover:text-[color:var(--paper)]'
                            }`}
                        >
                            <Library size={14} />
                            My Library ({allTexts.filter(t => savedTextIds.has(t.id)).length})
                        </button>
                    )}
                </div>

                {/* Search & Filters */}
                <div className="border-y border-[color:var(--line)] py-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--paper-faint)]" size={18} />
                            <input
                                type="text"
                                placeholder="Search by title, author, or tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-[color:var(--line)] text-[color:var(--paper)] placeholder-[color:var(--paper-faint)] focus:border-[color:var(--red-bright)] outline-none transition-colors"
                            />
                        </div>

                        {/* Filter Toggle (Mobile) */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden flex items-center gap-2 px-4 py-2.5 min-h-[44px] border border-[color:var(--line)] text-[color:var(--paper-dim)]"
                        >
                            <Filter size={18} />
                            Filters
                            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        {/* View Mode & Sort (Desktop) */}
                        <div className="hidden md:flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2.5 bg-transparent border border-[color:var(--line)] text-[color:var(--paper)] cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="title">Title A-Z</option>
                                <option value="year">Year</option>
                            </select>

                            <div className="flex border border-[color:var(--line)] overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 ${viewMode === 'grid' ? 'bg-[color:var(--red)] text-[#f5f0e6]' : 'text-[color:var(--paper-dim)] hover:text-[color:var(--paper)]'}`}
                                >
                                    <Grid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 ${viewMode === 'list' ? 'bg-[color:var(--red)] text-[#f5f0e6]' : 'text-[color:var(--paper-dim)] hover:text-[color:var(--paper)]'}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Row */}
                    <div className={`mt-4 flex flex-wrap gap-3 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
                        {/* Category Filter */}
                        <div className="flex items-center gap-2">
                            <Globe size={16} className="text-[color:var(--paper-faint)]" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 bg-transparent border border-[color:var(--line)] text-sm text-[color:var(--paper)] cursor-pointer"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'all' ? 'All Categories' : cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Language Filter */}
                        <div className="flex items-center gap-2">
                            <Tag size={16} className="text-[color:var(--paper-faint)]" />
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="px-3 py-2 bg-transparent border border-[color:var(--line)] text-sm text-[color:var(--paper)] cursor-pointer"
                            >
                                {languages.map(lang => (
                                    <option key={lang} value={lang}>
                                        {lang === 'all' ? 'All Languages' : LanguageNames[lang] || lang}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Mobile Sort */}
                        <div className="md:hidden flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 bg-transparent border border-[color:var(--line)] text-sm text-[color:var(--paper)] cursor-pointer"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="title">Title</option>
                                <option value="year">Year</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="text-sm text-[color:var(--paper-dim)] mb-4">
                    {filteredTexts.length} {filteredTexts.length === 1 ? 'text' : 'texts'} found
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-[color:var(--red-bright)] animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-[color:var(--red-bright)] mb-4">{error}</p>
                        <button onClick={fetchTexts} className="text-[color:var(--red-bright)] hover:underline">
                            Try again
                        </button>
                    </div>
                ) : filteredTexts.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-16 h-16 mx-auto text-[color:var(--paper-faint)] mb-4" />
                        {browseMode === 'library' ? (
                            <>
                                <p className="text-[color:var(--paper-dim)] text-lg">No saved texts in your library</p>
                                <p className="text-[color:var(--paper-faint)] text-sm mt-2">Save texts from the Revolutionary Theory page or browse all texts above</p>
                                <button
                                    onClick={() => setBrowseMode('all')}
                                    className="mt-4 px-4 py-2 min-h-[44px] bg-[color:var(--red)] hover:bg-[color:var(--red-bright)] text-[#f5f0e6] text-sm font-medium transition-colors"
                                >
                                    Browse All Texts
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-[color:var(--paper-dim)] text-lg">No texts available yet</p>
                                <p className="text-[color:var(--paper-faint)] text-sm mt-2">Texts will appear here once uploaded by admins or the community</p>
                            </>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTexts.map(text => (
                            <TextCard
                                key={text.id}
                                text={text}
                                isAdmin={isAdmin && isAdmin()}
                                onDelete={handleDeleteText}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTexts.map(text => (
                            <TextCard
                                key={text.id}
                                text={text}
                                variant="list"
                                isAdmin={isAdmin && isAdmin()}
                                onDelete={handleDeleteText}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextBrowser;
