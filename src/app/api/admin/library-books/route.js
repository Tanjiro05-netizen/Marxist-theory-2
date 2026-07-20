import { isAdminProfile, isAdminUser } from '@/src/lib/auth.js';
import { getServerAuthState } from '@/src/lib/server-auth.js';
import { createClient } from '@/src/lib/supabase/server.js';

export const runtime = 'nodejs';

const json = (body, status = 200) => Response.json(body, { status });

const requireAdmin = async () => {
  const { user, profile } = await getServerAuthState();

  if (!user) {
    return { error: json({ message: 'Not authenticated.' }, 401) };
  }

  if (!isAdminProfile(profile) && !isAdminUser(user)) {
    return { error: json({ message: 'Not authorized.' }, 403) };
  }

  return { user, profile };
};

const nullableString = (value) => {
  const trimmed = `${value || ''}`.trim();
  return trimmed || null;
};

const nullableInteger = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getCoverStoragePath = (coverUrl) => {
  if (!coverUrl) return null;
  const cleanUrl = `${coverUrl}`.split('?')[0];

  if (cleanUrl.includes('/covers/')) {
    return decodeURIComponent(cleanUrl.split('/covers/').pop());
  }

  if (!cleanUrl.startsWith('http')) {
    return decodeURIComponent(cleanUrl.split('/').pop() || cleanUrl);
  }

  return null;
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

const buildBookPayload = (book, { includeEpub = false, requireReadableFile = false } = {}) => {
  const title = nullableString(book?.title);
  if (!title) throw new Error('Title is required.');

  const payload = {
    title,
    author: nullableString(book?.author),
    year: nullableInteger(book?.year),
    description: nullableString(book?.description),
    category: nullableString(book?.category),
    era: nullableString(book?.era),
    language: nullableString(book?.language),
    pages: nullableInteger(book?.pages),
    pdf_filename: nullableString(book?.pdf_filename),
    cover_image_url: nullableString(book?.cover_image_url),
    is_official: book?.is_official !== false,
  };

  if (includeEpub || hasOwn(book, 'epub_filename')) {
    payload.epub_filename = nullableString(book?.epub_filename);
  }

  if (requireReadableFile && !payload.epub_filename && !payload.pdf_filename) {
    throw new Error('EPUB or PDF file is required.');
  }

  return payload;
};

const deleteStoredFiles = async (supabase, { pdfPath, coverPath }) => {
  const removals = [];

  if (pdfPath) {
    removals.push(supabase.storage.from('library').remove([pdfPath]));
  }

  if (coverPath) {
    removals.push(supabase.storage.from('covers').remove([coverPath]));
  }

  await Promise.allSettled(removals);
};

export async function POST(request) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  let payload;
  try {
    payload = buildBookPayload(body?.book, { includeEpub: true, requireReadableFile: true });
  } catch (error) {
    return json({ message: error.message }, 400);
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('digital_library_books')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    return json({ message: error.message || 'Could not save book.' }, 500);
  }

  return json({ id: data?.id || null });
}

export async function PATCH(request) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const bookId = nullableString(body?.bookId);
  if (!bookId) return json({ message: 'Book id is required.' }, 400);

  let payload;
  try {
    payload = buildBookPayload(body?.book);
  } catch (error) {
    return json({ message: error.message }, 400);
  }

  const supabase = createClient();
  const { data: existingBook, error: fetchError } = await supabase
    .from('digital_library_books')
    .select('id, epub_filename, pdf_filename, cover_image_url')
    .eq('id', bookId)
    .single();

  if (fetchError || !existingBook) {
    return json({ message: fetchError?.message || 'Book not found.' }, fetchError?.code === 'PGRST116' ? 404 : 500);
  }

  const nextEpub = hasOwn(payload, 'epub_filename') ? payload.epub_filename : existingBook.epub_filename;
  if (!nextEpub && !payload.pdf_filename) {
    return json({ message: 'A readable EPUB or PDF file is required.' }, 400);
  }

  const oldPdfToRemove =
    existingBook.pdf_filename &&
    (body?.removeExistingPdf === true ||
      (payload.pdf_filename && payload.pdf_filename !== existingBook.pdf_filename))
      ? existingBook.pdf_filename
      : null;

  const nextCoverPath = getCoverStoragePath(payload.cover_image_url);
  const existingCoverPath = getCoverStoragePath(existingBook.cover_image_url);
  const oldCoverToRemove =
    existingCoverPath &&
    (body?.removeExistingCover === true || (nextCoverPath && nextCoverPath !== existingCoverPath))
      ? existingCoverPath
      : null;

  const { error: updateError } = await supabase
    .from('digital_library_books')
    .update(payload)
    .eq('id', bookId);

  if (updateError) {
    return json({ message: updateError.message || 'Could not update book.' }, 500);
  }

  await deleteStoredFiles(supabase, {
    pdfPath: oldPdfToRemove,
    coverPath: oldCoverToRemove,
  });

  return json({ id: bookId });
}
