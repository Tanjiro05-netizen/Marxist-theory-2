/**
 * Book and audiobook covers, resized before they are sent.
 *
 * The files in storage are full-size artwork — several megabytes for some
 * of them — while a catalogue card shows a thumbnail 144px wide. Pointing
 * <img> straight at storage (or at a proxy that only pipes the bytes
 * through) downloaded the whole plate to draw a stamp. These go through
 * Next's image optimizer instead, which scales them to the size actually
 * drawn, re-encodes to AVIF/WebP where the browser takes it, and caches the
 * result. next.config.js allows exactly the two buckets below.
 */

const COVER_BUCKETS = ['covers', 'audiobooks'];
const STORAGE_PREFIX = '/storage/v1/object/public/';

/* Widths the optimizer is configured to emit (next.config images.imageSizes
   and deviceSizes). Asking for anything else is rejected. */
const ALLOWED_WIDTHS = [96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];

const supabaseOrigin = () => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  } catch {
    return null;
  }
};

const isCoverStorageUrl = (parsed) => {
  const origin = supabaseOrigin();
  if (!origin || parsed.origin !== origin) return false;
  if (!parsed.pathname.startsWith(STORAGE_PREFIX)) return false;
  const bucket = parsed.pathname.slice(STORAGE_PREFIX.length).split('/')[0];
  return COVER_BUCKETS.includes(bucket);
};

/**
 * Rewrite a cover URL to an optimized one at `width` device pixels.
 * Anything that isn't a cover in our own storage is returned untouched.
 */
export const coverImageSrc = (coverUrl, width = 384, quality = 70) => {
  if (!coverUrl) return coverUrl;

  let parsed;
  try {
    parsed = new URL(coverUrl, typeof window === 'undefined' ? 'https://marxist.info' : window.location.origin);
  } catch {
    return coverUrl;
  }

  if (!isCoverStorageUrl(parsed)) return coverUrl;

  const w = ALLOWED_WIDTHS.includes(width)
    ? width
    : ALLOWED_WIDTHS.find((candidate) => candidate >= width) || ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];

  return `/_next/image?url=${encodeURIComponent(parsed.toString())}&w=${w}&q=${quality}`;
};

export default coverImageSrc;
