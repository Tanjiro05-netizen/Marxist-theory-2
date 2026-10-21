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

/* Validate + normalize the stored text edition ({ sections: [{id, title, level, md}] }). */
const sanitizeTextEdition = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'object' || !Array.isArray(value.sections)) {
    throw new Error('text_edition must be an object with a sections array.');
  }

  const sections = value.sections.slice(0, 2000).map((section, idx) => ({
    id: nullableString(section?.id) || `s${idx + 1}`,
    title: nullableString(section?.title) || `Section ${idx + 1}`,
    level: Number.isFinite(section?.level)
      ? Math.min(6, Math.max(1, Math.round(section.level)))
      : 1,
    md: `${section?.md || ''}`,
  }));

  const words = sections.reduce((sum, sec) => sum + sec.md.split(/\s+/).filter(Boolean).length, 0);
  const source = ['md', 'txt', 'extracted', 'manual'].includes(value.source) ? value.source : 'manual';

  return {
    sections,
    reading_minutes: nullableInteger(value.reading_minutes) || Math.max(1, Math.round(words / 200)),
    source,
    generated_at: nullableString(value.generated_at) || new Date().toISOString(),
  };
};

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

  if (hasOwn(book, 'text_edition')) {
    payload.text_edition = sanitizeTextEdition(book?.text_edition);
  }

  // A stored text edition is a readable edition in its own right — books can
  // exist with no EPUB/PDF at all (text-only ingest; covers follow later).
  if (requireReadableFile && !payload.epub_filename && !payload.pdf_filename && !payload.text_edition) {
    throw new Error('EPUB, PDF or text edition is required.');
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
    .select('id, epub_filename, pdf_filename, cover_image_url, text_edition')
    .eq('id', bookId)
    .single();

  if (fetchError || !existingBook) {
    return json({ message: fetchError?.message || 'Book not found.' }, fetchError?.code === 'PGRST116' ? 404 : 500);
  }

  const nextEpub = hasOwn(payload, 'epub_filename') ? payload.epub_filename : existingBook.epub_filename;
  const nextTextEdition = hasOwn(payload, 'text_edition') ? payload.text_edition : existingBook.text_edition;
  if (!nextEpub && !payload.pdf_filename && !nextTextEdition) {
    return json({ message: 'A readable EPUB, PDF or text edition is required.' }, 400);
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
