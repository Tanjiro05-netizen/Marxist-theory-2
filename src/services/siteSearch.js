import { supabase } from '../supabaseClient';
import { prefetchQuery } from '../lib/queryCache';
import { loadSubstackPosts } from './substackApi';
import { normalizeSearchQuery } from '../utils/textSearch';

/**
 * Site-wide search aggregator behind the header palette. One query fans out
 * to every LIVE section (production blocks theory/glossary/study/... routes
 * behind DummyComingSoon, so they are deliberately absent here). Library
 * passages come from the search_library_text() RPC; everything else is a
 * cached list filtered in memory. Sources fail independently — a broken
 * table or edge function never blanks the palette.
 *
 * Only production-live detail routes are linked:
 *   /book/:id, /digital-library, /science-tech/courses/:slug, /substack/:slug.
 */

/* Static quick links shown when their (translated) names match the query. */
export const SITE_PAGES = [
    { href: '/home', labelKey: 'nav.home' },
    { href: '/digital-library', labelKey: 'nav.library' },
    { href: '/science-tech', labelKey: 'nav.scienceTech' },
    { href: '/substack', labelKey: 'nav.substack' },
    { href: '/feed', labelKey: 'nav.feed' },
];

export const SEARCH_GROUP_ORDER = ['pages', 'books', 'passages', 'courses', 'substack', 'audiobooks'];

export const SEARCH_GROUP_LABEL_KEYS = {
    pages: 'search.groupPages',
    books: 'search.groupBooks',
    passages: 'search.groupPassages',
    courses: 'search.groupCourses',
    substack: 'search.groupSubstack',
    audiobooks: 'search.groupAudiobooks',
};

const LIMITS = { pages: 4, books: 5, passages: 4, courses: 4, substack: 4, audiobooks: 3 };
/* The passages RPC trigram-matches from three characters up. */
const MIN_PASSAGE_QUERY = 3;

const emptyResult = () => ({
    pages: [], books: [], passages: [], courses: [], substack: [], audiobooks: [],
});

const fetchBooksList = () =>
    prefetchQuery('site-search:books', async () => {
        const { data, error } = await supabase
            .from('digital_library_books')
            .select('id,title,author,year,category,language')
            .order('title')
            .limit(500);
        return error ? [] : (data || []);
    });

const fetchAudiobooksList = () =>
    prefetchQuery('site-search:audiobooks', async () => {
        const { data, error } = await supabase
            .from('audiobooks')
            .select('id,title,author,narrator')
            .order('title')
            .limit(300);
        return error ? [] : (data || []);
    });

const fetchCoursesList = () =>
    prefetchQuery('site-search:courses', async () => {
        const { data, error } = await supabase
            .from('science_courses')
            .select('id,title,slug,subtitle,level,science_subjects(name,slug)')
            .eq('status', 'published')
            .limit(100);
        if (error || !Array.isArray(data)) return [];
        return data;
    });

const fetchSubstackPosts = () =>
    prefetchQuery('site-search:substack', async () => {
        try {
            const result = await loadSubstackPosts();
            return result?.posts || [];
        } catch {
            return [];
        }
    });

const fetchPassages = (query) =>
    prefetchQuery(`site-search:passages:${query}`, async () => {
        const { data, error } = await supabase.rpc('search_library_text', {
            p_query: query,
            p_mode: 'auto',
            p_limit_per_book: 1,
            p_max_books: 6,
        });
        if (error) throw error;
        return data || [];
    });

const includesQuery = (query, ...fields) =>
    fields.some((field) => field && String(field).toLowerCase().includes(query));

/**
 * Search everything. `labelTranslator` (key => string) is used to match the
 * static page links against their translated names.
 */
export const searchSite = async (rawQuery, { labelTranslator } = {}) => {
    const trimmed = String(rawQuery || '').trim().toLowerCase();
    if (trimmed.length < 2) return emptyResult();
    const query = normalizeSearchQuery(rawQuery).toLowerCase() || trimmed;
    const translate = typeof labelTranslator === 'function' ? labelTranslator : (key) => key;

    const pages = SITE_PAGES.filter((page) => includesQuery(query, translate(page.labelKey)))
        .slice(0, LIMITS.pages)
        .map((page) => ({ ...page }));

    const settled = await Promise.allSettled([
        fetchBooksList(),
        query.length >= MIN_PASSAGE_QUERY ? fetchPassages(query) : Promise.resolve([]),
        fetchCoursesList(),
        fetchSubstackPosts(),
        fetchAudiobooksList(),
    ]);
    const value = (index, fallback = []) => (settled[index].status === 'fulfilled' ? settled[index].value : fallback);

    const books = value(0)
        .filter((book) => includesQuery(query, book.title, book.author, book.category))
        .slice(0, LIMITS.books)
        .map((book) => ({ ...book, href: `/book/${book.id}` }));

    const passages = value(1)
        .map((row) => ({
            ...row,
            href: `/book/${row.book_id}?section=${encodeURIComponent(row.section_id)}&q=${encodeURIComponent(query)}`,
        }))
        .slice(0, LIMITS.passages);

    const courses = value(2)
        .filter((course) => includesQuery(query, course.title, course.subtitle, course.science_subjects?.name))
        .slice(0, LIMITS.courses)
        .map((course) => ({ ...course, href: `/science-tech/courses/${course.slug}` }));

    const substack = value(3)
        .filter((post) => includesQuery(query, post.title, post.excerpt))
        .slice(0, LIMITS.substack)
        .map((post) => ({ ...post, href: `/substack/${post.slug}` }));

    const audiobooks = value(4)
        .filter((audio) => includesQuery(query, audio.title, audio.author, audio.narrator))
        .slice(0, LIMITS.audiobooks)
        .map((audio) => ({
            ...audio,
            // No detail route — land on the library filtered by title instead.
            href: `/digital-library?q=${encodeURIComponent(audio.title)}`,
        }));

    return { pages, books, passages, courses, substack, audiobooks };
};

/** Flattened, ordered item list for keyboard navigation in the palette. */
export const flattenSearchResults = (result) =>
    SEARCH_GROUP_ORDER.flatMap((group) =>
        (result?.[group] || []).map((item, index) => ({ ...item, group, key: `${group}-${item.id ?? item.href}-${index}` }))
    );
