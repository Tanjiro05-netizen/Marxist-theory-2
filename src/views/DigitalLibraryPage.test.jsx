import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import DigitalLibraryPage from './DigitalLibraryPage';
import { supabase } from '../supabaseClient';

jest.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        isAdmin: () => true,
    }),
}));

jest.mock('../context/AudioPlayerContext', () => ({
    useAudioPlayer: () => ({
        playAudiobook: jest.fn(),
    }),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, opts) => {
            const translations = {
                'library.title': 'Digital Library',
                'library.subtitle': 'Library subtitle',
                'library.myLists': 'My Lists',
                'library.documents': 'Documents',
                'library.languages': 'Languages',
                'library.downloads': 'Downloads',
                'library.archive': 'The Archive',
                'library.allCategories': 'All Categories',
                'library.allEras': 'All Eras',
                'library.allLanguages': 'All Languages',
                'library.era19': '19th Century',
                'library.era20': '20th Century',
                'library.era21': '21st Century',
                'library.titles': 'titles',
                'library.read': 'Read',
                'library.open': 'Open',
                'library.readNow': 'Read Now',
                'library.openPdf': 'Open PDF',
                'library.openExternal': 'Open in external viewer',
                'library.listenNow': 'Listen Now',
                'library.unknownAuthor': 'Unknown',
                'library.pagesWord': 'pages',
                'library.gridView': 'Grid view',
                'library.listView': 'List view',
                'library.categories.history': 'History',
                'library.categories.downloads': 'Downloads',
                'library.categories.audiobooks': 'Audiobooks',
                'library.formatText': 'Text',
                'library.formatPdf': 'PDF',
                'library.formatAudio': 'Audiobook',
                'library.minYearLabel': 'Earliest year',
                'library.maxYearLabel': 'Latest year',
                'book.downloadPDF': 'Download PDF',
                'library.searchPlaceholder': 'Search',
                'library.noBooks': 'No books',
                'library.inTheTexts': 'In the texts',
                'library.passagesCount': '{{count}} passages',
                'library.passagesHint': 'Passage hint',
                'library.exactMatchBadge': 'Exact phrase',
                'library.allWordsBadge': 'All words',
                'library.moreInBook': '+{{count}} more matches in this book',
                'library.noPassages': 'No passages',
                'common.loading': 'Loading',
            };
            let str = translations[key] || key;
            if (opts) {
                Object.entries(opts).forEach(([name, value]) => {
                    str = str.split(`{{${name}}}`).join(String(value));
                });
            }
            return str;
        },
    }),
}));

jest.mock('../components/Library/AddToListButton', () => () => <button>Add to list</button>);
jest.mock('../components/Library/ReadingListPanel', () => () => <div>Reading lists</div>);

// The page fetches through a module-level query cache; bypass it so every
// test sees its own mocked Supabase responses instead of the first test's.
jest.mock('../lib/queryCache', () => ({
    prefetchQuery: (_key, fetcher) => fetcher(),
}));

jest.mock('../supabaseClient', () => {
    const liveChannel = {
        on: jest.fn(() => liveChannel),
        subscribe: jest.fn(() => liveChannel),
    };
    return {
        supabase: {
            from: jest.fn(),
            rpc: jest.fn(),
            channel: jest.fn(() => liveChannel),
            removeChannel: jest.fn(),
            storage: {
                from: jest.fn(),
            },
        },
    };
});

/* The catalog is read with named columns (never `*` — that would drag every
   book's full text over the wire), plus a tiny id-only query for which books
   have a text edition. This builds a Supabase double matching both. */
const mockCatalog = (books, audiobooks = []) => {
    const result = (data) => {
        const thenable = Promise.resolve({ data, error: null });
        thenable.not = () => Promise.resolve({ data, error: null });
        return thenable;
    };

    supabase.from.mockImplementation((tableName) => ({
        select: jest.fn((columns) => {
            if (tableName === 'digital_library_books' && columns === 'id') {
                return result(books.filter((b) => b.text_edition).map(({ id }) => ({ id })));
            }
            if (tableName === 'digital_library_books') {
                return result(books);
            }
            if (tableName === 'audiobooks') {
                return result(audiobooks);
            }
            throw new Error(`Unexpected select ${tableName}.${columns}`);
        }),
    }));
};

describe('DigitalLibraryPage', () => {
    const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        // The page now syncs filters into the URL — start every test clean.
        window.history.replaceState(null, '', '/digital-library');
    });

    afterEach(() => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    });

    test('shows ebooks without PDFs and hides the external PDF button', async () => {
        const bookWithoutPdf = {
            id: 'book-1',
            title: 'Book Without PDF',
            author: 'Test Author',
            year: 1920,
            description: 'Readable through EPUB only.',
            category: 'History',
            era: '20th Century',
            language: 'English',
            pages: 100,
            epub_filename: 'book.epub',
            pdf_filename: null,
            cover_image_url: null,
        };

        mockCatalog([bookWithoutPdf]);

        supabase.storage.from.mockReturnValue({
            getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://library.test/${path}` } })),
        });

        render(<DigitalLibraryPage />);

        expect(await screen.findByRole('link', { name: /Book Without PDF/ })).toBeInTheDocument();
        const readLink = screen.getByTestId('ebook-read-link');
        expect(readLink).toHaveAttribute('href', '/book/book-1');
        expect(readLink).toHaveTextContent(/^Read$/);
        expect(screen.queryByTestId('ebook-external-pdf-link')).not.toBeInTheDocument();

        await waitFor(() => {
            expect(supabase.storage.from).not.toHaveBeenCalledWith('library');
        });
    });

    test('serves Supabase cover images resized through the image optimizer', async () => {
        const coverUrl = 'https://example.supabase.co/storage/v1/object/public/covers/covered-book.png';
        const bookWithCover = {
            id: 'book-2',
            title: 'Covered Book',
            author: 'Test Author',
            year: 1921,
            description: 'Has a cover.',
            category: 'History',
            era: '20th Century',
            language: 'English',
            pages: 101,
            epub_filename: 'covered.epub',
            pdf_filename: null,
            cover_image_url: coverUrl,
        };

        mockCatalog([bookWithCover]);

        const { container } = render(<DigitalLibraryPage />);

        expect(await screen.findByRole('link', { name: /Covered Book/ })).toBeInTheDocument();
        // The default list view renders the cover as a small decorative plate
        // (alt=""), so query the img element directly.
        const coverImg = container.querySelector('img');
        // Same-origin, and scaled to the size the card actually draws rather
        // than the full-size plate in storage.
        expect(coverImg).toHaveAttribute(
            'src',
            `/_next/image?url=${encodeURIComponent(coverUrl)}&w=384&q=70`
        );
    });

    test('groups pure PDF books into their own Downloads section and filter', async () => {
        const epubBook = {
            id: 'book-epub',
            title: 'EPUB History',
            author: 'Test Author',
            year: 1922,
            description: 'Readable as EPUB.',
            category: 'History',
            era: '20th Century',
            language: 'English',
            pages: null,
            epub_filename: 'history.epub',
            pdf_filename: null,
            cover_image_url: null,
        };
        const pdfBook = {
            id: 'book-pdf',
            title: 'PDF Pamphlet',
            author: 'PDF Author',
            year: 1930,
            description: 'Readable as PDF only.',
            category: 'History',
            era: '20th Century',
            language: 'English',
            pages: 44,
            epub_filename: null,
            pdf_filename: 'pamphlet.pdf',
            cover_image_url: null,
        };

        mockCatalog([epubBook, pdfBook]);

        supabase.storage.from.mockReturnValue({
            getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://library.test/${path}` } })),
        });

        render(<DigitalLibraryPage />);

        // The unfiltered catalog lists both books; the pure-PDF book lives in
        // its own Downloads bucket (sidebar row + Open/PDF card actions).
        expect(await screen.findByRole('link', { name: /EPUB History/ })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /PDF Pamphlet/ })).toBeInTheDocument();
        const pdfCard = screen.getByTestId('pdf-book-card');
        expect(within(pdfCard).getByTestId('ebook-read-link')).toHaveTextContent(/^Open$/);
        const pdfDownload = within(pdfCard).getByRole('link', { name: 'Download PDF' });
        expect(pdfDownload).toHaveAttribute('href', 'https://library.test/pamphlet.pdf');
        expect(pdfDownload).toHaveAttribute('download', 'PDF Pamphlet.pdf');

        // Filtering to Downloads shows the admin upload action and only PDFs.
        fireEvent.click(screen.getByRole('button', { name: /^Downloads/ }));

        expect(await screen.findByRole('link', { name: 'Upload PDF' })).toHaveAttribute(
            'href',
            '/admin/library/upload?format=pdf'
        );
        expect(screen.getByRole('link', { name: /PDF Pamphlet/ })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /EPUB History/ })).not.toBeInTheDocument();
    });

    test('filters by format checkbox and narrows by publication year', async () => {
        const epubBook = {
            id: 'book-epub',
            title: 'EPUB History',
            author: 'Test Author',
            year: 1922,
            description: 'Readable as EPUB.',
            category: 'History',
            era: '20th Century',
            language: 'English',
            pages: null,
            epub_filename: 'history.epub',
            pdf_filename: null,
            cover_image_url: null,
        };
        const pdfBook = {
            id: 'book-pdf',
            title: 'PDF Pamphlet',
            author: 'PDF Author',
            year: 1930,
            description: 'Readable as PDF only.',
            category: 'History',
            era: '20th Century',
            language: 'English',
            pages: 44,
            epub_filename: null,
            pdf_filename: 'pamphlet.pdf',
            cover_image_url: null,
        };

        mockCatalog([epubBook, pdfBook]);
        supabase.storage.from.mockReturnValue({
            getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://library.test/${path}` } })),
        });

        render(<DigitalLibraryPage />);
        await screen.findByRole('link', { name: /EPUB History/ });

        // The Text checkbox keeps only readable editions.
        fireEvent.click(screen.getByRole('button', { name: /^Text/ }));
        expect(screen.getByRole('link', { name: /EPUB History/ })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /PDF Pamphlet/ })).not.toBeInTheDocument();

        // Swap to the PDF checkbox.
        fireEvent.click(screen.getByRole('button', { name: /^Text/ }));
        fireEvent.click(screen.getByRole('button', { name: /^PDF/ }));
        expect(screen.getByRole('link', { name: /PDF Pamphlet/ })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /EPUB History/ })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /^PDF/ }));

        // Year range is 1922–1930; raising the floor past 1922 drops the EPUB.
        fireEvent.change(screen.getByRole('slider', { name: 'Earliest year' }), {
            target: { value: '1925' },
        });
        expect(await screen.findByRole('link', { name: /PDF Pamphlet/ })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /EPUB History/ })).not.toBeInTheDocument();
    });

    test('prefilters the catalog from shared URL params', async () => {
        const epubBook = {
            id: 'book-epub',
            title: 'EPUB History',
            author: 'Test Author',
            year: 1922,
            description: 'Readable as EPUB.',
            category: 'History',
            era: '20th Century',
            language: 'English',
            pages: null,
            epub_filename: 'history.epub',
            pdf_filename: null,
            cover_image_url: null,
        };
        const pdfBook = {
            id: 'book-pdf',
            title: 'PDF Pamphlet',
            author: 'PDF Author',
            year: 1930,
            description: 'Readable as PDF only.',
            category: 'History',
            era: '20th Century',
            language: 'English',
            pages: 44,
            epub_filename: null,
            pdf_filename: 'pamphlet.pdf',
            cover_image_url: null,
        };

        mockCatalog([epubBook, pdfBook]);
        supabase.storage.from.mockReturnValue({
            getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://library.test/${path}` } })),
        });

        // A shared/Back-restored link: category + format + sort all carried in the URL.
        // (Pure-PDF books live in the Downloads section, not their DB category.)
        window.history.replaceState(null, '', '/digital-library?cat=Downloads&fmt=pdf&sort=oldest');
        render(<DigitalLibraryPage />);

        expect(await screen.findByRole('link', { name: /PDF Pamphlet/ })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /EPUB History/ })).not.toBeInTheDocument();

        window.history.replaceState(null, '', '/digital-library');
    });
});

describe('DigitalLibraryPage full-text search', () => {
    const searchableBook = {
        id: 'book-ft',
        title: 'Full Text Book',
        author: 'Search Author',
        year: 1930,
        description: 'Indexed text edition.',
        category: 'History',
        era: '20th Century',
        language: 'English',
        pages: 88,
        epub_filename: null,
        pdf_filename: null,
        cover_image_url: null,
    };

    const passageRow = {
        book_id: 'book-ft',
        title: 'Full Text Book',
        author: 'Search Author',
        year: 1930,
        category: 'History',
        era: '20th Century',
        language: 'English',
        cover_image_url: null,
        section_id: 's1',
        section_title: 'Chapter 1',
        snippet: 'A spectre is haunting Europe — the spectre of communism.',
        match_offset: 35,
        match_len: 21,
        snippet_cut_start: false,
        snippet_cut_end: true,
        is_exact: true,
        book_match_count: 2,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        window.history.replaceState(null, '', '/digital-library');

        mockCatalog([searchableBook]);
    });

    test('prefills from ?q=, renders highlighted passages and deep-links into the reader', async () => {
        supabase.rpc.mockResolvedValue({ data: [passageRow], error: null });
        // Shareable URL: the page picks the query up on mount.
        window.history.replaceState(null, '', '/digital-library?q=spectre%20of%20communism');

        render(<DigitalLibraryPage />);

        const hit = await screen.findByTestId('passage-hit', {}, { timeout: 4000 });
        expect(hit).toHaveAttribute('href', '/book/book-ft?section=s1&q=spectre%20of%20communism');
        expect(screen.getByTestId('passages-results')).toHaveTextContent('In the texts');
        expect(screen.getByTestId('passages-results')).toHaveTextContent('Exact phrase');
        // The snippet's <mark> wraps the matched phrase.
        expect(hit.querySelector('mark.lib-hit')).toHaveTextContent('spectre of communism');
        // book_match_count (2) vs one returned row (1).
        expect(screen.getByTestId('passages-results')).toHaveTextContent('+1 more matches');
    });

    test('exact-phrase mode hides the metadata grid and shows a no-passages state on empty results', async () => {
        supabase.rpc.mockResolvedValue({ data: [], error: null });

        render(<DigitalLibraryPage />);
        await screen.findByRole('link', { name: /Full Text Book/ });

        fireEvent.change(screen.getByTestId('search-mode-select'), { target: { value: 'exact' } });
        fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'cotton mills steam' } });

        await screen.findByTestId('no-passage-results', {}, { timeout: 4000 });
        // The no-results state can paint before the RPC call flushes — wait for it.
        await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith('search_library_text', {
            p_query: 'cotton mills steam',
            p_mode: 'exact',
            p_limit_per_book: 3,
            p_max_books: 20,
        }));
        // Phrase mode is carried by the passages block: no metadata cards.
        expect(screen.queryByTestId('ebook-card')).not.toBeInTheDocument();
    });

    test('author mode filters the grid client-side without calling the RPC', async () => {
        render(<DigitalLibraryPage />);
        await screen.findByRole('link', { name: /Full Text Book/ });

        fireEvent.change(screen.getByTestId('search-mode-select'), { target: { value: 'author' } });
        fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Nobody Writes Here' } });

        await screen.findByText('No books', {}, { timeout: 4000 });
        expect(supabase.rpc).not.toHaveBeenCalled();
    });

    test('RPC failures degrade quietly to metadata search', async () => {
        supabase.rpc.mockRejectedValue(new Error('function search_library_text does not exist'));

        render(<DigitalLibraryPage />);
        await screen.findByRole('link', { name: /Full Text Book/ });

        fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Full Text' } });

        // Give the debounce + rejected promise time to settle.
        await new Promise((resolve) => setTimeout(resolve, 900));
        expect(screen.queryByTestId('passages-block')).not.toBeInTheDocument();
        // Metadata matches still filter the grid as before.
        expect(screen.getByRole('link', { name: /Full Text Book/ })).toBeInTheDocument();
    });
});
