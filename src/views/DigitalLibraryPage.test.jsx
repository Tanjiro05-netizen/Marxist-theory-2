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
        t: (key) => {
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
                'book.downloadPDF': 'Download PDF',
                'library.searchPlaceholder': 'Search',
                'library.noBooks': 'No books',
                'common.loading': 'Loading',
            };
            return translations[key] || key;
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

jest.mock('../supabaseClient', () => ({
    supabase: {
        from: jest.fn(),
        storage: {
            from: jest.fn(),
        },
    },
}));

describe('DigitalLibraryPage', () => {
    const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
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

        supabase.from.mockImplementation((tableName) => ({
            select: jest.fn((columns) => {
                if (tableName === 'digital_library_books' && columns === '*') {
                    return Promise.resolve({ data: [bookWithoutPdf], error: null });
                }
                if (tableName === 'digital_library_books' && columns === 'category') {
                    return Promise.resolve({ data: [{ category: 'History' }], error: null });
                }
                if (tableName === 'audiobooks') {
                    return Promise.resolve({ data: [], error: null });
                }
                throw new Error(`Unexpected select ${tableName}.${columns}`);
            }),
        }));

        supabase.storage.from.mockReturnValue({
            getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://library.test/${path}` } })),
        });

        render(<DigitalLibraryPage />);

        expect(await screen.findByRole('link', { name: 'Book Without PDF' })).toBeInTheDocument();
        const readLink = screen.getByTestId('ebook-read-link');
        expect(readLink).toHaveAttribute('href', '/book/book-1');
        expect(readLink).toHaveTextContent(/^Read$/);
        expect(screen.queryByTestId('ebook-external-pdf-link')).not.toBeInTheDocument();

        await waitFor(() => {
            expect(supabase.storage.from).not.toHaveBeenCalledWith('library');
        });
    });

    test('serves Supabase cover images through the same-origin cover proxy', async () => {
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

        supabase.from.mockImplementation((tableName) => ({
            select: jest.fn((columns) => {
                if (tableName === 'digital_library_books' && columns === '*') {
                    return Promise.resolve({ data: [bookWithCover], error: null });
                }
                if (tableName === 'digital_library_books' && columns === 'category') {
                    return Promise.resolve({ data: [{ category: 'History' }], error: null });
                }
                if (tableName === 'audiobooks') {
                    return Promise.resolve({ data: [], error: null });
                }
                throw new Error(`Unexpected select ${tableName}.${columns}`);
            }),
        }));

        const { container } = render(<DigitalLibraryPage />);

        expect(await screen.findByRole('link', { name: 'Covered Book' })).toBeInTheDocument();
        // The default list view renders the cover as a small decorative plate
        // (alt=""), so query the img element directly.
        const coverImg = container.querySelector('img');
        expect(coverImg).toHaveAttribute(
            'src',
            `/api/cover-image?url=${encodeURIComponent(coverUrl)}`
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

        supabase.from.mockImplementation((tableName) => ({
            select: jest.fn((columns) => {
                if (tableName === 'digital_library_books' && columns === '*') {
                    return Promise.resolve({ data: [epubBook, pdfBook], error: null });
                }
                if (tableName === 'digital_library_books' && columns === 'category') {
                    return Promise.resolve({ data: [{ category: 'History' }, { category: 'History' }], error: null });
                }
                if (tableName === 'audiobooks') {
                    return Promise.resolve({ data: [], error: null });
                }
                throw new Error(`Unexpected select ${tableName}.${columns}`);
            }),
        }));

        supabase.storage.from.mockReturnValue({
            getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://library.test/${path}` } })),
        });

        render(<DigitalLibraryPage />);

        expect(await screen.findByRole('heading', { name: 'History' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Downloads' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'PDF Pamphlet' })).toBeInTheDocument();
        // The list-view card links to the reader with "Open" and offers the
        // PDF itself through the "PDF" anchor (Download icon + label).
        const pdfCard = screen.getAllByTestId('pdf-book-card')[0];
        expect(within(pdfCard).getByTestId('ebook-read-link')).toHaveTextContent(/^Open$/);
        const pdfDownload = within(pdfCard).getByRole('link', { name: 'PDF' });
        expect(pdfDownload).toHaveAttribute('href', 'https://library.test/pamphlet.pdf');
        expect(pdfDownload).toHaveAttribute('download', 'PDF Pamphlet.pdf');
        expect(screen.getByRole('link', { name: 'Upload PDF' })).toHaveAttribute(
            'href',
            '/admin/library/upload?format=pdf'
        );

        fireEvent.click(screen.getByRole('button', { name: 'Downloads' }));

        expect(await screen.findByRole('link', { name: 'PDF Pamphlet' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'EPUB History' })).not.toBeInTheDocument();
    });
});
