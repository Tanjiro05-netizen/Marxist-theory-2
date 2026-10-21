import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LibraryUploadPage from './LibraryUploadPage';
import { supabase } from '../../supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

let mockSearchParams = new URLSearchParams();
const mockPush = jest.fn();

jest.mock('../../supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
        },
        from: jest.fn(),
        storage: {
            from: jest.fn(),
        },
    },
}));

jest.mock('./AudiobookUploadForm', () => () => <div>Audiobook form</div>);

const buildFetchBookQuery = (book) => {
    const query = {
        select: jest.fn(() => query),
        eq: jest.fn(() => query),
        single: jest.fn().mockResolvedValue({ data: book, error: null }),
    };

    return query;
};

const buildUpdateBookQuery = () => {
    const query = {
        update: jest.fn(() => query),
        eq: jest.fn().mockResolvedValue({ error: null }),
    };

    return query;
};

const setupEditBookMocks = ({ book, updateQuery = buildUpdateBookQuery() }) => {
    const fetchQuery = buildFetchBookQuery(book);
    const queue = [fetchQuery, updateQuery];

    supabase.from.mockImplementation((tableName) => {
        if (tableName !== 'digital_library_books') {
            throw new Error(`Unexpected table ${tableName}`);
        }
        const next = queue.shift();
        if (!next) throw new Error('No mock query queued');
        return next;
    });

    return { fetchQuery, updateQuery };
};

const setupStorageMocks = () => {
    const libraryStorage = {
        upload: jest.fn().mockResolvedValue({ error: null }),
        uploadToSignedUrl: jest.fn().mockResolvedValue({ error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://library.test/${path}` } })),
    };
    const coverStorage = {
        upload: jest.fn().mockResolvedValue({ error: null }),
        uploadToSignedUrl: jest.fn().mockResolvedValue({ error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://covers.test/${path}` } })),
    };

    supabase.storage.from.mockImplementation((bucket) => {
        if (bucket === 'library') return libraryStorage;
        if (bucket === 'covers') return coverStorage;
        throw new Error(`Unexpected bucket ${bucket}`);
    });

    return { libraryStorage, coverStorage };
};

const jsonBodyFor = (call) => JSON.parse(call[1].body);
const fetchCallsFor = (fragment) => global.fetch.mock.calls.filter(([url]) => `${url}`.includes(fragment));

const existingBook = {
    id: 'book-1',
    title: 'Existing Book',
    author: 'Old Author',
    year: 1917,
    description: 'Existing description',
    category: 'History',
    era: '20th Century',
    language: 'English',
    pages: 321,
    is_official: true,
    epub_filename: 'epub-existing-book.epub',
    pdf_filename: 'old.pdf',
    cover_image_url: 'https://example.supabase.co/storage/v1/object/public/covers/old-cover.jpg',
};

describe('LibraryUploadPage ebook editing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue({ push: mockPush, replace: jest.fn(), back: jest.fn() });
        useSearchParams.mockImplementation(() => mockSearchParams);
        mockPush.mockReset();
        mockSearchParams = new URLSearchParams();
        localStorage.clear();
        supabase.auth.getSession.mockResolvedValue({
            data: { session: { access_token: 'session-token-123' } },
            error: null,
        });
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ token: 'signed-token' }),
        });
        setupStorageMocks();
    });

    test('requires an EPUB for new ebook uploads', () => {
        render(<LibraryUploadPage />);

        fireEvent.change(screen.getByPlaceholderText('e.g., Capital Volume I'), {
            target: { name: 'title', value: 'New Book' },
        });

        expect(screen.queryByText('PDF Pages')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Upload Book' })).toBeDisabled();
    });

    test('generates API-safe storage names from awkward titles and extensions', async () => {
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1710000000000);
        const { libraryStorage } = setupStorageMocks();

        render(<LibraryUploadPage />);

        fireEvent.change(screen.getByPlaceholderText('e.g., Capital Volume I'), {
            target: { name: 'title', value: '!!!' },
        });
        const epub = new File(['epub'], 'NATIONAL.EPUB', { type: 'application/epub+zip' });
        fireEvent.change(screen.getByLabelText('Click to upload EPUB'), {
            target: { files: [epub] },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Upload Book' }));

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-upload-url')).toHaveLength(1);
        });
        expect(jsonBodyFor(fetchCallsFor('/api/admin/library-upload-url')[0])).toEqual({
            bucket: 'library',
            path: 'epub-book-1710000000000.epub',
        });
        await waitFor(() => {
            expect(libraryStorage.uploadToSignedUrl).toHaveBeenCalledWith(
                'epub-book-1710000000000.epub',
                'signed-token',
                epub,
                expect.objectContaining({ contentType: 'application/epub+zip', upsert: false })
            );
        });

        nowSpy.mockRestore();
    });

    test('starts in PDF upload mode from the Downloads entry point', () => {
        mockSearchParams = new URLSearchParams('format=pdf');

        render(<LibraryUploadPage />);

        expect(screen.getByRole('heading', { name: 'Upload to Downloads' })).toBeInTheDocument();
        expect(screen.getByText('PDF File *')).toBeInTheDocument();
        expect(screen.queryByText(/EPUB File/)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Upload PDF' })).toBeDisabled();
    });

    test('also starts in PDF upload mode from the Downloads alias', () => {
        mockSearchParams = new URLSearchParams('section=downloads');

        render(<LibraryUploadPage />);

        expect(screen.getByRole('heading', { name: 'Upload to Downloads' })).toBeInTheDocument();
        expect(screen.getByText('PDF File *')).toBeInTheDocument();
        expect(screen.queryByText(/EPUB File/)).not.toBeInTheDocument();
    });

    test('switches to Downloads mode when a PDF is uploaded before an EPUB', async () => {
        render(<LibraryUploadPage />);

        fireEvent.change(screen.getByPlaceholderText('e.g., Capital Volume I'), {
            target: { name: 'title', value: 'PDF First Upload' },
        });
        const pdf = new File(['pdf'], 'source.pdf', { type: 'application/pdf' });
        fireEvent.change(screen.getByLabelText('Click to upload PDF'), {
            target: { files: [pdf] },
        });

        expect(await screen.findByRole('heading', { name: 'Upload to Downloads' })).toBeInTheDocument();
        expect(screen.getByText('PDF File *')).toBeInTheDocument();
        expect(screen.queryByText(/EPUB File/)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Upload PDF' })).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: 'Upload PDF' }));

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-upload-url')).toHaveLength(1);
            expect(fetchCallsFor('/api/admin/library-books')).toHaveLength(1);
        });
    });

    test('uploads a pure PDF book without requiring an EPUB', async () => {
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1710000000000);
        const { libraryStorage } = setupStorageMocks();

        render(<LibraryUploadPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Downloads' }));
        expect(screen.queryByLabelText('Click to upload EPUB')).not.toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('e.g., Capital Volume I'), {
            target: { name: 'title', value: 'PDF Only Book' },
        });
        const pdf = new File(['pdf'], 'source.pdf', { type: 'application/pdf' });
        fireEvent.change(screen.getByLabelText('Click to upload PDF'), {
            target: { files: [pdf] },
        });
        fireEvent.change(screen.getByPlaceholderText('e.g., 500'), {
            target: { name: 'pages', value: '42' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Upload PDF' }));

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-upload-url')).toHaveLength(1);
        });
        expect(jsonBodyFor(fetchCallsFor('/api/admin/library-upload-url')[0])).toEqual({
            bucket: 'library',
            path: 'pdf-pdf-only-book-1710000000000.pdf',
        });
        await waitFor(() => {
            expect(libraryStorage.uploadToSignedUrl).toHaveBeenCalledWith(
                'pdf-pdf-only-book-1710000000000.pdf',
                'signed-token',
                pdf,
                expect.objectContaining({ contentType: 'application/pdf', upsert: false })
            );
        });

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-books')).toHaveLength(1);
        });
        const saveCall = fetchCallsFor('/api/admin/library-books')[0];
        expect(saveCall[1]).toEqual(expect.objectContaining({ method: 'POST' }));
        expect(jsonBodyFor(saveCall).book).toEqual(
            expect.objectContaining({
                title: 'PDF Only Book',
                epub_filename: null,
                pdf_filename: 'pdf-pdf-only-book-1710000000000.pdf',
                pages: 42,
            })
        );

        nowSpy.mockRestore();
    });

    test('loads an existing ebook and can save metadata without uploading a new EPUB', async () => {
        mockSearchParams = new URLSearchParams('edit=book&id=book-1');
        setupEditBookMocks({
            book: { ...existingBook, pdf_filename: null, cover_image_url: null },
        });

        render(<LibraryUploadPage />);

        expect(await screen.findByDisplayValue('Existing Book')).toBeInTheDocument();
        expect(screen.getByText('epub-existing-book.epub')).toBeInTheDocument();
        expect(screen.queryByText('PDF Pages')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();

        fireEvent.change(screen.getByPlaceholderText('e.g., Karl Marx'), {
            target: { name: 'author', value: 'New Author' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-books')).toHaveLength(1);
        });

        const patchCall = fetchCallsFor('/api/admin/library-books')[0];
        expect(patchCall[1]).toEqual(expect.objectContaining({ method: 'PATCH' }));
        expect(patchCall[1].headers).not.toHaveProperty('Authorization');
        expect(jsonBodyFor(patchCall)).toEqual(
            expect.objectContaining({
                bookId: 'book-1',
                book: expect.objectContaining({
                    author: 'New Author',
                    pdf_filename: null,
                    cover_image_url: null,
                }),
            })
        );
        expect(jsonBodyFor(patchCall).book).not.toHaveProperty('epub_filename');
    });

    test('can add a PDF to an existing ebook that does not have one', async () => {
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1710000000000);
        mockSearchParams = new URLSearchParams('edit=book&id=book-1');
        setupEditBookMocks({
            book: { ...existingBook, pdf_filename: null, cover_image_url: null },
        });
        const { libraryStorage } = setupStorageMocks();

        render(<LibraryUploadPage />);

        await screen.findByDisplayValue('Existing Book');

        const pdf = new File(['pdf'], 'download.pdf', { type: 'application/pdf' });
        fireEvent.change(screen.getByLabelText('Click to upload PDF'), {
            target: { files: [pdf] },
        });
        expect(screen.getByText('PDF Pages')).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText('e.g., 500'), {
            target: { name: 'pages', value: '88' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-upload-url')).toHaveLength(1);
        });
        expect(jsonBodyFor(fetchCallsFor('/api/admin/library-upload-url')[0])).toEqual({
            bucket: 'library',
            path: 'pdf-existing-book-1710000000000.pdf',
        });
        await waitFor(() => {
            expect(libraryStorage.uploadToSignedUrl).toHaveBeenCalledWith(
                'pdf-existing-book-1710000000000.pdf',
                'signed-token',
                pdf,
                expect.objectContaining({ contentType: 'application/pdf', upsert: false })
            );
        });

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-books')).toHaveLength(1);
        });

        expect(jsonBodyFor(fetchCallsFor('/api/admin/library-books')[0]).book).toEqual(
            expect.objectContaining({
                pdf_filename: 'pdf-existing-book-1710000000000.pdf',
                pages: 88,
            })
        );

        nowSpy.mockRestore();
    });

    test('replaces PDF and cover, then deletes the old storage files', async () => {
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1710000000000);
        mockSearchParams = new URLSearchParams('edit=book&id=book-1');
        setupEditBookMocks({ book: existingBook });
        const { libraryStorage, coverStorage } = setupStorageMocks();

        render(<LibraryUploadPage />);

        await screen.findByDisplayValue('Existing Book');

        const replacementPdf = new File(['new pdf'], 'replacement.pdf', { type: 'application/pdf' });
        const replacementCover = new File(['cover'], 'replacement.jpg', { type: 'image/jpeg' });

        fireEvent.click(screen.getByRole('button', { name: 'Remove PDF' }));
        fireEvent.change(screen.getByLabelText('Click to upload PDF'), {
            target: { files: [replacementPdf] },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Remove cover' }));
        fireEvent.change(screen.getByLabelText('Click to upload cover'), {
            target: { files: [replacementCover] },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-upload-url')).toHaveLength(2);
            expect(fetchCallsFor('/api/admin/library-books')).toHaveLength(1);
        });

        expect(libraryStorage.uploadToSignedUrl).toHaveBeenCalledWith(
            'pdf-existing-book-1710000000000.pdf',
            'signed-token',
            replacementPdf,
            expect.objectContaining({ contentType: 'application/pdf' })
        );
        expect(coverStorage.uploadToSignedUrl).toHaveBeenCalledWith(
            'cover-existing-book-1710000000000.jpg',
            'signed-token',
            replacementCover,
            expect.objectContaining({ contentType: 'image/jpeg' })
        );
        expect(jsonBodyFor(fetchCallsFor('/api/admin/library-books')[0])).toEqual(
            expect.objectContaining({
                removeExistingPdf: true,
                removeExistingCover: true,
                book: expect.objectContaining({
                    pdf_filename: 'pdf-existing-book-1710000000000.pdf',
                    cover_image_url:
                        'https://example.supabase.co/storage/v1/object/public/covers/cover-existing-book-1710000000000.jpg',
                }),
            })
        );
        nowSpy.mockRestore();
    });

    test('removes existing PDF and cover and cleans up their storage files', async () => {
        mockSearchParams = new URLSearchParams('edit=book&id=book-1');
        setupEditBookMocks({ book: existingBook });
        setupStorageMocks();

        render(<LibraryUploadPage />);

        await screen.findByDisplayValue('Existing Book');

        fireEvent.click(screen.getByRole('button', { name: 'Remove PDF' }));
        fireEvent.click(screen.getByRole('button', { name: 'Remove cover' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-books')).toHaveLength(1);
        });

        expect(jsonBodyFor(fetchCallsFor('/api/admin/library-books')[0])).toEqual(
            expect.objectContaining({
                removeExistingPdf: true,
                removeExistingCover: true,
                book: expect.objectContaining({
                    pdf_filename: null,
                    cover_image_url: null,
                    pages: null,
                }),
            })
        );
        expect(fetchCallsFor('/api/admin/library-upload-url')).toHaveLength(0);
    });

    test('does not require a browser Supabase session token when saving metadata', async () => {
        mockSearchParams = new URLSearchParams('edit=book&id=book-1');
        supabase.auth.getSession.mockResolvedValueOnce({
            data: { session: null },
            error: null,
        });
        setupEditBookMocks({
            book: { ...existingBook, pdf_filename: null, cover_image_url: null },
        });

        render(<LibraryUploadPage />);

        await screen.findByDisplayValue('Existing Book');
        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(fetchCallsFor('/api/admin/library-books')).toHaveLength(1);
        });

        expect(supabase.auth.getSession).not.toHaveBeenCalled();
        expect(fetchCallsFor('/api/admin/library-books')[0][1].headers).not.toHaveProperty('Authorization');
    });
});
