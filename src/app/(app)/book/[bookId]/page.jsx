import BookReaderPage from '@/src/views/BookReaderPage.jsx';
import { supabaseAnonKey, supabaseUrl } from '@/src/lib/supabase/config.js';

/**
 * The reader's shell is rendered on the server.
 *
 * Opening a book used to be three waits in a row: download the JavaScript,
 * ask the database which file this book is, then fetch the file. The first
 * two are the same for every reader and the answer never changes, so they
 * happen here instead — cached, and close to the database. The page arrives
 * with its title page already drawn and, more importantly, with a preload
 * for the book file itself, so the browser starts pulling it while React is
 * still booting rather than seconds later.
 *
 * Only metadata is fetched here. A book's text edition is megabytes and
 * would be paid for twice (once in the HTML, once in the hydration payload),
 * so the reader still fetches that itself.
 */

/* Books change when an editor uploads one; an hour of staleness on the
   title page is invisible, and the reader revalidates client-side anyway. */
export const revalidate = 3600;

const META_COLUMNS = 'id,title,author,year,pages,description,cover_image_url,epub_filename,pdf_filename,category';

const publicFileUrl = (bucket, filename) =>
  filename ? `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(filename)}` : null;

const fetchBookMeta = async (bookId) => {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  /* A plain fetch rather than the JS client, so Next can cache the response
     on its own data cache and share it between readers. */
  const url =
    `${supabaseUrl}/rest/v1/digital_library_books` +
    `?select=${META_COLUMNS}&id=eq.${encodeURIComponent(bookId)}&limit=1`;

  try {
    const response = await fetch(url, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
      next: { revalidate },
    });
    if (!response.ok) return null;
    const rows = await response.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    /* The reader fetches the book for itself regardless; a failure here
       costs the head start, not the page. */
    return null;
  }
};

export async function generateMetadata({ params }) {
  const { bookId } = await params;
  const book = await fetchBookMeta(bookId);
  if (!book) return { title: 'Marxist.info' };

  return {
    title: `${book.title}${book.author ? ` — ${book.author}` : ''} · Marxist.info`,
    description: book.description || undefined,
  };
}

export default async function Page({ params }) {
  const { bookId } = await params;
  const book = await fetchBookMeta(bookId);
  const epubUrl = publicFileUrl('library', book?.epub_filename);

  return (
    <>
      {/* Starts the book downloading as the HTML is parsed, instead of
          after the bundle has booted and asked the database. */}
      {epubUrl && <link rel="preload" as="fetch" href={epubUrl} crossOrigin="anonymous" />}
      <BookReaderPage initialBook={book} />
    </>
  );
}
