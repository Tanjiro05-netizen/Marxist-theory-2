import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'next/navigation';
import BookReaderPage from './BookReaderPage';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'common.bookmark': 'Bookmark',
        'common.bookmarked': 'Bookmarked',
        'book.downloadPDF': 'Download PDF',
        'book.noFile': 'No readable file found for this book.',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../components/EpubReader/EpubReader', () => () => <div data-testid="mock-epub-reader">EPUB reader</div>);
/* TextEditionReader pulls in react-markdown/remark-gfm (ESM) — mocked per
   project convention (see PoliticsArticleReader.test.jsx). */
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../components/Library/AddToListButton', () => () => <button>Add to list</button>);
jest.mock('../components/Library/BookReviewSection', () => () => <div>Reviews</div>);

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

const mockUseAuth = useAuth;
const mockUseParams = useParams;

const bookId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

const makeQuery = (methods = {}) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(() => query),
    ...methods,
  };
  return query;
};

const renderBookReader = () => render(<BookReaderPage />);

describe('BookReaderPage bookmarks', () => {
  let bookQuery;
  let bookmarkQuery;
  let progressQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: userId } });
    mockUseParams.mockReturnValue({ bookId });

    bookQuery = makeQuery({
      single: jest.fn().mockResolvedValue({
        data: {
          id: bookId,
          title: 'Reader Test Book',
          author: 'Author',
          year: 2024,
          description: 'A test book',
          cover_image_url: null,
          epub_filename: 'reader-test.epub',
          pdf_filename: null,
          category: 'Theory',
        },
        error: null,
      }),
    });
    bookmarkQuery = makeQuery({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
    progressQuery = makeQuery({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    supabase.from.mockImplementation((table) => {
      if (table === 'digital_library_books') return bookQuery;
      if (table === 'user_book_bookmarks') return bookmarkQuery;
      if (table === 'user_book_progress') return progressQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    supabase.storage.from.mockReturnValue({
      getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://cdn.test/${path}` } })),
    });
  });

  test('adds a bookmark for an authenticated user after Supabase succeeds', async () => {
    renderBookReader();

    const bookmarkButton = await screen.findByRole('button', { name: /Bookmark/i });
    await userEvent.click(bookmarkButton);

    await waitFor(() => {
      expect(bookmarkQuery.insert).toHaveBeenCalledWith({ user_id: userId, book_id: bookId });
      expect(screen.getByRole('button', { name: /Bookmarked/i })).toBeInTheDocument();
    });
  });

  test('does not show a successful bookmark state when Supabase rejects the insert', async () => {
    bookmarkQuery.insert.mockResolvedValueOnce({ error: new Error('permission denied') });

    renderBookReader();

    const bookmarkButton = await screen.findByRole('button', { name: /^Bookmark$/i });
    await userEvent.click(bookmarkButton);

    await waitFor(() => {
      expect(bookmarkQuery.insert).toHaveBeenCalled();
    });
    expect(screen.getByRole('button', { name: /^Bookmark$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bookmarked/i })).not.toBeInTheDocument();
  });

  test('renders the PDF reader when a book has no EPUB file', async () => {
    bookQuery.single.mockResolvedValueOnce({
      data: {
        id: bookId,
        title: 'PDF Only Reader Test',
        author: 'Author',
        year: 2024,
        description: 'A PDF-only test book',
        cover_image_url: null,
        epub_filename: null,
        pdf_filename: 'pdf-only.pdf',
        category: 'Theory',
      },
      error: null,
    });

    renderBookReader();

    expect(await screen.findByTestId('book-reader-pdf')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-epub-reader')).not.toBeInTheDocument();
    expect(screen.getByTitle('PDF Only Reader Test')).toHaveAttribute('src', 'https://cdn.test/pdf-only.pdf');
  });
});
