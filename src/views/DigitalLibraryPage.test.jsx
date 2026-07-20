import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
                'library.searchPlaceholder': 'Search',
                'library.allEras': 'All Eras',
                'library.allLanguages': 'All Languages',
                'library.noBooks': 'No books',
                'common.loading': 'Loading',
            };
            return translations[key] || key;
        },
    }),
}));

jest.mock('../components/Library/AddToListButton', () => () => <button>Add to list</button>);
jest.mock('../components/Library/ReadingListPanel', () => () => <div>Reading lists</div>);

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
        expect(screen.getByText('Read Now')).toBeInTheDocument();
        expect(screen.queryByTitle('Open in external viewer')).not.toBeInTheDocument();

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

        render(<DigitalLibraryPage />);

        expect(await screen.findByRole('img', { name: 'Covered Book' })).toHaveAttribute(
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
        expect(screen.getByRole('link', { name: 'Open PDF' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
            'href',
            'https://library.test/pamphlet.pdf'
        );
        expect(screen.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
            'download',
            'PDF Pamphlet.pdf'
        );
        expect(screen.getByRole('link', { name: 'Upload PDF' })).toHaveAttribute(
            'href',
            '/admin/library/upload?format=pdf'
        );

        fireEvent.click(screen.getByRole('button', { name: 'Downloads' }));

        expect(await screen.findByRole('link', { name: 'PDF Pamphlet' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'EPUB History' })).not.toBeInTheDocument();
    });
});
