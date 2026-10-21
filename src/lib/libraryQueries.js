import { supabase } from '../supabaseClient';
import { prefetchQuery } from './queryCache';

/**
 * Catalog queries for the digital library.
 *
 * The books table carries `text_edition` — the entire typeset text of every
 * book as jsonb. Across the shelf that is several megabytes, and a catalog
 * listing never reads a word of it: it only needs to know whether a text
 * edition exists, to choose between "Read" and "Open". So the list query
 * names its columns and leaves `text_edition` in the database, and a second
 * tiny query returns just the ids that have one.
 *
 * Keep this list in step with the columns the catalog actually renders —
 * never widen it to `*`, which would drag the whole corpus back over the
 * wire on every visit (and, through the idle prefetch, on every page).
 */
export const LIBRARY_LIST_COLUMNS = [
  'id',
  'title',
  'author',
  'year',
  'pages',
  'description',
  'category',
  'cover_image_url',
  'epub_filename',
  'pdf_filename',
  'language',
  'era',
  'is_official',
  'downloads',
  'created_at',
].join(', ');

/** Columns the reader needs, including the text edition itself. */
export const BOOK_DETAIL_COLUMNS =
  'id, title, author, year, pages, description, cover_image_url, epub_filename, pdf_filename, text_edition, category';

/* Books whose text edition exists — ids only, a couple of kilobytes. */
const fetchTextEditionIds = async () => {
  const { data, error } = await supabase
    .from('digital_library_books')
    .select('id')
    .not('text_edition', 'is', null);
  if (error) throw error;
  return new Set((data || []).map((row) => row.id));
};

const fetchBookList = async () => {
  const { data, error } = await supabase
    .from('digital_library_books')
    .select(LIBRARY_LIST_COLUMNS);
  if (error) throw error;
  return data || [];
};

/** The catalog rows, each tagged with `has_text_edition`. */
export const fetchLibraryBooks = async () => {
  const [books, textEditionIds] = await Promise.all([fetchBookList(), fetchTextEditionIds()]);
  return books.map((book) => ({ ...book, has_text_edition: textEditionIds.has(book.id) }));
};

/** Everything the library page opens with: books, categories, audiobooks. */
export const fetchLibraryCatalog = async () => {
  const [allData, audiobooksResponse] = await Promise.all([
    fetchLibraryBooks(),
    supabase.from('audiobooks').select('*'),
  ]);
  if (audiobooksResponse.error) throw audiobooksResponse.error;

  return {
    allData,
    // Categories used to be a second full-table query; the list already
    // carries every row's category, so derive it instead.
    categoriesData: allData.map(({ category }) => ({ category })),
    audiobooksData: audiobooksResponse.data || [],
  };
};

/* ── Opening one book ───────────────────────────────────────────────── */

const warmedFiles = new Set();

/* Speculative work is a courtesy, not a right: skip it when the reader has
   asked to save data or is on a slow link. */
const mayPrefetchFiles = () => {
  const connection = typeof navigator === 'undefined' ? null : navigator.connection;
  if (!connection) return true;
  if (connection.saveData) return false;
  return !/(^|-)[23]g$/.test(connection.effectiveType || '');
};

export const bookQueryKey = (bookId) => `book:${bookId}`;

/** The reader's own row: metadata plus the text edition it renders. */
export const fetchBook = async (bookId) => {
  const { data, error } = await supabase
    .from('digital_library_books')
    .select(BOOK_DETAIL_COLUMNS)
    .eq('id', bookId)
    .single();
  if (error) throw new Error(error.message || 'Book not found.');
  if (!data) throw new Error('Book not found.');
  return data;
};

/**
 * Warm a book before it is opened — on hover, focus or touch of its card.
 *
 * Opening a book is a chain: fetch the row, read the file name out of it,
 * then fetch the book itself. Starting the first link while the reader is
 * still deciding takes it off the clock entirely. `epubFilename` lets the
 * file start downloading at the same time, since the catalog already knows
 * the name — the chain collapses into one wait instead of two.
 */
export const prefetchBook = (bookId, epubFilename) => {
  if (!bookId) return;

  prefetchQuery(bookQueryKey(bookId), () => fetchBook(bookId)).catch(() => {});

  if (!epubFilename || warmedFiles.has(epubFilename) || !mayPrefetchFiles()) return;
  warmedFiles.add(epubFilename);
  const { data } = supabase.storage.from('library').getPublicUrl(epubFilename);
  if (!data?.publicUrl) return;
  /* Pulls it into the HTTP/service-worker cache; the reader reads it from
     there. Failures are irrelevant — the reader will fetch it normally. */
  fetch(data.publicUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {
    warmedFiles.delete(epubFilename);
  });
};

