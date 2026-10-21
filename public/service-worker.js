const STATIC_CACHE = 'static-v1';
const GOOGLE_FONTS_CACHE = 'google-fonts';
const IMAGE_CACHE = 'images-v2';
const IMAGE_MAX_ENTRIES = 60;
const IMAGE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/* One book's own row, text edition and all — by far the heaviest thing the
   site fetches, and a published text that does not change between two
   readings. Opening a book you have read before should cost nothing, so
   these are served from the cache and refreshed behind the reader.
   Catalog LISTS deliberately stay uncached (see below): they change as the
   shelf is edited, and they are small. */
const BOOK_CACHE = 'library-book-v1';
const BOOK_MAX_ENTRIES = 40;
const BOOK_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const isSingleBookRead = (url) =>
  url.pathname.startsWith('/rest/v1/digital_library_books') &&
  /(^|&)id=eq\./.test(url.search.slice(1));

/* The EPUB and PDF files themselves. Storage serves the older ones with
   `private, no-cache`, so the browser re-downloaded a whole book — a
   megabyte or more — every time it was opened. Each upload path carries its
   own timestamp and is never rewritten, so the copy on disk is always the
   right one: serve it and skip the network entirely. */
const BOOK_FILE_CACHE = 'library-files-v1';
const BOOK_FILE_MAX_ENTRIES = 12;
const BOOK_FILE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const isBookFile = (url) => url.pathname.startsWith('/storage/v1/object/public/library/');

const trimCache = async (cacheName, maxEntries) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  while (keys.length > maxEntries) {
    await cache.delete(keys.shift());
  }
};

const cacheResponse = async (cacheName, request, response, maxEntries) => {
  // Cross-origin image requests are often opaque responses with status 0.
  // They cannot be reconstructed with custom headers, so pass them through.
  if (!response || response.status !== 200 || response.type === 'opaque') return response;

  try {
    const cache = await caches.open(cacheName);
    const headers = new Headers(response.headers);
    headers.set('x-sw-cached-at', `${Date.now()}`);
    const body = await response.clone().blob();
    await cache.put(
      request,
      new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    );
    await trimCache(cacheName, maxEntries);
  } catch {
    return response;
  }

  return response;
};

const isFresh = (response, maxAgeMs) => {
  const cachedAt = Number(response?.headers.get('x-sw-cached-at') || 0);
  return cachedAt > 0 && Date.now() - cachedAt <= maxAgeMs;
};

const cacheFirst = async (request, cacheName, maxEntries, maxAgeMs) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached && isFresh(cached, maxAgeMs)) return cached;

  const response = await fetch(request);
  return cacheResponse(cacheName, request, response, maxEntries);
};

const staleWhileRevalidate = async (request, cacheName, maxEntries, maxAgeMs) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => cacheResponse(cacheName, request, response, maxEntries))
    .catch(() => null);

  if (cached && isFresh(cached, maxAgeMs)) {
    networkPromise.catch(() => null);
    return cached;
  }

  return (await networkPromise) || cached || fetch(request);
};

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) =>
                ![STATIC_CACHE, GOOGLE_FONTS_CACHE, IMAGE_CACHE, BOOK_CACHE, BOOK_FILE_CACHE].includes(name)
            )
            .map((name) => caches.delete(name))
        )
      ),
    ])
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSupabase = url.origin.includes('supabase');
  const isSupabaseAuth = isSupabase && url.pathname.startsWith('/auth/');
  const isGoogleFont =
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com';

  if (isSupabaseAuth) {
    event.respondWith(fetch(request));
    return;
  }

  if (isGoogleFont) {
    event.respondWith(staleWhileRevalidate(request, GOOGLE_FONTS_CACHE, IMAGE_MAX_ENTRIES, IMAGE_MAX_AGE_MS));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, IMAGE_MAX_ENTRIES, IMAGE_MAX_AGE_MS));
    return;
  }

  if (isSupabase && isBookFile(url)) {
    event.respondWith(cacheFirst(request, BOOK_FILE_CACHE, BOOK_FILE_MAX_ENTRIES, BOOK_FILE_MAX_AGE_MS));
    return;
  }

  if (isSupabase && isSingleBookRead(url)) {
    event.respondWith(staleWhileRevalidate(request, BOOK_CACHE, BOOK_MAX_ENTRIES, BOOK_MAX_AGE_MS));
    return;
  }

  if (isSupabase) {
    event.respondWith(fetch(request));
  }
});
