import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Book, BookOpen, FileText, GraduationCap, Library, Loader2, Search, Sparkles } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const SUGGESTIONS = ['Imperialism', 'Dialectics', 'Paris Commune', 'The State', 'Class Struggle', 'Lenin'];

const SOURCE_META = {
    glossary:  { label: 'Glossary',  icon: Book,           color: 'border-emerald-800 bg-emerald-950/40 text-emerald-200' },
    study:     { label: 'Study',     icon: GraduationCap,  color: 'border-sky-800 bg-sky-950/40 text-sky-200' },
    theory:    { label: 'Theory',    icon: FileText,        color: 'border-amber-800 bg-amber-950/40 text-amber-200' },
    library:   { label: 'Library',   icon: Library,         color: 'border-violet-800 bg-violet-950/40 text-violet-200' },
};

const searchAllSources = async (query) => {
    const q = query.trim();
    if (!q) return { glossary: [], study: [], theory: [], library: [] };

    const pattern = `%${q}%`;

    const [glossaryRes, studyRes, theoryRes, libraryRes] = await Promise.all([
        supabase
            .from('glossary')
            .select('id, term, type, explanation, related_terms')
            .or(`term.ilike.${pattern},explanation.ilike.${pattern}`)
            .order('term')
            .limit(12),
        supabase
            .from('study_resources')
            .select('id, title, type, author, excerpt, category, digital_library_book_id')
            .or(`title.ilike.${pattern},excerpt.ilike.${pattern},author.ilike.${pattern},category.ilike.${pattern}`)
            .order('sort_order')
            .limit(8),
        supabase
            .from('theory_articles')
            .select('id, slug, title, excerpt, description, collection, is_featured, is_classic')
            .or(`title.ilike.${pattern},excerpt.ilike.${pattern},description.ilike.${pattern},collection.ilike.${pattern}`)
            .order('created_at', { ascending: false })
            .limit(8),
        supabase
            .from('digital_library_books')
            .select('id, title, author, year, description, category, era, language')
            .or(`title.ilike.${pattern},author.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)
            .order('title')
            .limit(8),
    ]);

    return {
        glossary: glossaryRes.data || [],
        study:    studyRes.data    || [],
        theory:   theoryRes.data   || [],
        library:  libraryRes.data  || [],
    };
};

const SourceBadge = ({ source }) => {
    const meta = SOURCE_META[source];
    if (!meta) return null;
    const Icon = meta.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.color}`}>
            <Icon className="h-3 w-3" />
            {meta.label}
        </span>
    );
};

const ResultCard = ({ source, children }) => (
    <div className="rounded-none border border-zinc-800 bg-black/30 p-4 transition hover:border-zinc-700">
        <div className="mb-2">
            <SourceBadge source={source} />
        </div>
        {children}
    </div>
);

const Bibliography = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchedTopic, setSearchedTopic] = useState('');

    const runSearch = useCallback(async (topic) => {
        const trimmed = (topic ?? query).trim();
        if (!trimmed) return;
        setQuery(trimmed);
        setLoading(true);
        setError(null);
        try {
            const data = await searchAllSources(trimmed);
            setResults(data);
            setSearchedTopic(trimmed);
        } catch (err) {
            console.error('Research Companion search error:', err);
            setError(err.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    }, [query]);

    const handleSubmit = (event) => {
        event.preventDefault();
        runSearch();
    };

    const totalResults = results
        ? results.glossary.length + results.study.length + results.theory.length + results.library.length
        : 0;

    const relatedTerms = results
        ? [...new Set(results.glossary.flatMap((g) => g.related_terms || []))].filter(
            (t) => !results.glossary.some((g) => g.term === t)
        ).slice(0, 10)
        : [];

    return (
        <div className="space-y-6 text-white">
            <div className="rounded-none border border-red-900/20 bg-black/30 p-5 backdrop-blur-sm md:p-6">
                <div className="mb-5 flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-900/40 bg-red-950/30 px-3 py-1 text-xs uppercase tracking-[0.24em] text-red-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        Bibliography
                    </div>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-white">Cross-source topic lookup</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                    Search across glossary, study resources, theory articles, and the digital library in one query.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="e.g. Imperialism, Paris Commune, Dialectics"
                            className="w-full rounded-none border border-zinc-800 bg-black/50 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-red-700"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="inline-flex items-center gap-2 rounded-none bg-red-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-40"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Search
                    </button>
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => runSearch(s)}
                            className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="rounded-none border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">{error}</div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-red-400" />
                </div>
            )}

            {results && !loading && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-baseline gap-3">
                        <h3 className="text-xl font-semibold text-white">{searchedTopic}</h3>
                        <span className="text-sm text-zinc-500">
                            {totalResults} result{totalResults !== 1 ? 's' : ''} across {Object.values(results).filter((arr) => arr.length > 0).length} source{Object.values(results).filter((arr) => arr.length > 0).length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {totalResults === 0 && (
                        <div className="rounded-none border border-zinc-800 bg-zinc-950/70 p-8 text-center">
                            <p className="text-zinc-400">No results found for "{searchedTopic}". Try a broader term or one of the suggestions above.</p>
                        </div>
                    )}

                    {results.glossary.length > 0 && (
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <SourceBadge source="glossary" />
                                <span className="text-xs text-zinc-500">{results.glossary.length} entries</span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {results.glossary.map((entry) => (
                                    <ResultCard key={entry.id} source="glossary">
                                        <Link href={`/glossary/${encodeURIComponent(entry.term)}?from=bibliography`} className="group">
                                            <h4 className="text-base font-medium text-white group-hover:text-red-300">{entry.term}</h4>
                                            <span className="mt-1 inline-block rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">{entry.type}</span>
                                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{entry.explanation}</p>
                                        </Link>
                                    </ResultCard>
                                ))}
                            </div>
                        </section>
                    )}

                    {results.theory.length > 0 && (
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <SourceBadge source="theory" />
                                <span className="text-xs text-zinc-500">{results.theory.length} articles</span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {results.theory.map((article) => (
                                    <ResultCard key={article.id} source="theory">
                                        <Link href={`/theory/article/${article.slug}`} className="group">
                                            <h4 className="text-base font-medium text-white group-hover:text-red-300">{article.title}</h4>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {article.collection && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">{article.collection}</span>}
                                                {article.is_classic && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">Classic</span>}
                                                {article.is_featured && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">Featured</span>}
                                            </div>
                                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{article.excerpt || article.description}</p>
                                        </Link>
                                    </ResultCard>
                                ))}
                            </div>
                        </section>
                    )}

                    {results.study.length > 0 && (
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <SourceBadge source="study" />
                                <span className="text-xs text-zinc-500">{results.study.length} resources</span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {results.study.map((res) => (
                                    <ResultCard key={res.id} source="study">
                                        <h4 className="text-base font-medium text-white">{res.title}</h4>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">{res.type}</span>
                                            {res.author && <span className="text-xs text-zinc-500">{res.author}</span>}
                                            {res.category && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">{res.category}</span>}
                                        </div>
                                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{res.excerpt || 'No description available.'}</p>
                                        {res.digital_library_book_id && (
                                            <Link href={`/book/${res.digital_library_book_id}`} className="mt-2 inline-flex items-center gap-1.5 text-xs text-red-300 hover:text-red-200">
                                                <BookOpen className="h-3 w-3" /> Open in reader
                                            </Link>
                                        )}
                                    </ResultCard>
                                ))}
                            </div>
                        </section>
                    )}

                    {results.library.length > 0 && (
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <SourceBadge source="library" />
                                <span className="text-xs text-zinc-500">{results.library.length} books</span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {results.library.map((book) => (
                                    <ResultCard key={book.id} source="library">
                                        <Link href={`/book/${book.id}`} className="group">
                                            <h4 className="text-base font-medium text-white group-hover:text-red-300">{book.title}</h4>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {book.author && <span className="text-xs text-zinc-500">{book.author}</span>}
                                                {book.year && <span className="text-xs text-zinc-500">({book.year})</span>}
                                                {book.category && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">{book.category}</span>}
                                                {book.era && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">{book.era}</span>}
                                            </div>
                                            {book.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{book.description}</p>}
                                        </Link>
                                    </ResultCard>
                                ))}
                            </div>
                        </section>
                    )}

                    {relatedTerms.length > 0 && (
                        <section className="rounded-none border border-zinc-800 bg-zinc-950/70 p-5">
                            <h4 className="mb-3 text-sm font-medium text-zinc-300">Related glossary terms</h4>
                            <div className="flex flex-wrap gap-2">
                                {relatedTerms.map((term) => (
                                    <button
                                        key={term}
                                        type="button"
                                        onClick={() => runSearch(term)}
                                        className="rounded-full border border-zinc-800 bg-black/30 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default Bibliography;
