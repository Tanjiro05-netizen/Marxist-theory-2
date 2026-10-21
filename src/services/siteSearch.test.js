import { searchSite, flattenSearchResults, SITE_PAGES, SEARCH_GROUP_ORDER } from './siteSearch';
import { supabase } from '../supabaseClient';
import { loadSubstackPosts } from './substackApi';

jest.mock('../supabaseClient', () => ({
    supabase: {
        from: jest.fn(),
        rpc: jest.fn(),
    },
}));

jest.mock('./substackApi', () => ({
    loadSubstackPosts: jest.fn(),
}));

jest.mock('../lib/queryCache', () => ({
    prefetchQuery: (_key, fetcher) => fetcher(),
}));

const listQuery = (rows) => ({
    select: jest.fn(() => listQuery(rows)),
    order: jest.fn(() => listQuery(rows)),
    limit: jest.fn(() => Promise.resolve({ data: rows, error: null })),
    eq: jest.fn(() => listQuery(rows)),
});

describe('searchSite', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        loadSubstackPosts.mockResolvedValue({ posts: [] });
    });

    test('returns empty groups for short queries without touching Supabase', async () => {
        const result = await searchSite('a');
        expect(result.books).toEqual([]);
        expect(supabase.from).not.toHaveBeenCalled();
        expect(supabase.rpc).not.toHaveBeenCalled();
    });

    test('filters books in memory and maps detail hrefs', async () => {
        supabase.from.mockImplementation((table) => {
            if (table === 'digital_library_books') {
                return listQuery([
                    { id: 'b1', title: 'Capital Vol I', author: 'Marx', year: 1867, category: 'Political Economy', language: 'English' },
                    { id: 'b2', title: 'Unrelated', author: 'Nobody', year: 2001, category: 'History', language: 'English' },
                ]);
            }
            return listQuery([]);
        });

        const result = await searchSite('marx');

        expect(result.books).toHaveLength(1);
        expect(result.books[0]).toMatchObject({ id: 'b1', href: '/book/b1' });
        expect(result.audiobooks).toEqual([]);
    });

    test('fetches passages only from three characters and deep-links them', async () => {
        supabase.from.mockImplementation(() => listQuery([]));
        supabase.rpc.mockResolvedValue({
            data: [
                {
                    book_id: 'b1',
                    title: 'Capital Vol I',
                    section_id: 's3',
                    section_title: 'Chapter 3',
                    snippet: 'the transformation of money into capital',
                    match_offset: 4,
                    match_len: 15,
                    snippet_cut_start: true,
                    snippet_cut_end: false,
                    is_exact: true,
                    book_match_count: 1,
                },
            ],
            error: null,
        });

        const twoChar = await searchSite('mo');
        expect(supabase.rpc).not.toHaveBeenCalled();
        expect(twoChar.passages).toEqual([]);

        const result = await searchSite('money into capital');
        expect(supabase.rpc).toHaveBeenCalledWith('search_library_text', {
            p_query: 'money into capital',
            p_mode: 'auto',
            p_limit_per_book: 1,
            p_max_books: 6,
        });
        expect(result.passages[0].href).toBe('/book/b1?section=s3&q=money%20into%20capital');
    });

    test('one failing source never blanks the others', async () => {
        supabase.from.mockImplementation((table) => {
            if (table === 'digital_library_books') return listQuery([{ id: 'b1', title: 'Found', author: null }]);
            return listQuery([]);
        });
        supabase.rpc.mockRejectedValue(new Error('function search_library_text does not exist'));
        loadSubstackPosts.mockRejectedValue(new Error('edge function down'));

        const result = await searchSite('found');
        expect(result.books.map((b) => b.title)).toEqual(['Found']);
        expect(result.passages).toEqual([]);
        expect(result.substack).toEqual([]);
    });

    test('maps substack, courses and audiobooks to their live routes', async () => {
        supabase.from.mockImplementation((table) => {
            if (table === 'science_courses') {
                return listQuery([
                    {
                        id: 'c1',
                        title: 'Physics 101',
                        slug: 'physics-101',
                        subtitle: null,
                        level: 'Beginner',
                        science_subjects: { name: 'Physics', slug: 'physics' },
                    },
                ]);
            }
            if (table === 'audiobooks') {
                return listQuery([{ id: 'a1', title: 'Manifesto Audio', author: 'Marx', narrator: 'Voice' }]);
            }
            return listQuery([]);
        });
        loadSubstackPosts.mockResolvedValue({
            posts: [{ id: 'p1', title: 'On the Manifesto', slug: 'on-the-manifesto', excerpt: null }],
        });

        const result = await searchSite('manifesto');

        expect(result.substack[0].href).toBe('/substack/on-the-manifesto');
        expect(result.audiobooks[0].href).toBe('/digital-library?q=Manifesto%20Audio');
        expect(result.courses).toEqual([]);
    });

    test('matches static pages by their translated labels', async () => {
        supabase.from.mockImplementation(() => listQuery([]));
        const translate = (key) => ({ 'nav.home': 'Startseite', 'nav.library': 'Bibliothek' }[key] || key);

        const result = await searchSite('biblio', { labelTranslator: translate });

        expect(result.pages).toEqual([{ href: '/digital-library', labelKey: 'nav.library' }]);
    });
});

describe('flattenSearchResults', () => {
    test('keeps the canonical group order and attaches group + stable keys', () => {
        const flat = flattenSearchResults({
            audiobooks: [{ id: 'a', href: '/x' }],
            books: [{ id: 'b', href: '/y' }],
            passages: [],
        });
        expect(flat.map((item) => item.group)).toEqual(['books', 'audiobooks']);
        expect(flat[0].key).toContain('books');
        expect(SEARCH_GROUP_ORDER[0]).toBe('pages');
        expect(SITE_PAGES.length).toBeGreaterThan(3);
    });
});
