/**
 * Minimal stale-while-revalidate query cache (zero dependencies).
 *
 * A module-level Map shared across the app. Entries hold the data, the
 * fetch timestamp, and the in-flight promise so parallel callers share a
 * single request. The goal is instant page transitions: a cached entry is
 * returned synchronously while a background revalidation refreshes it.
 */

const DEFAULT_TTL_MS = 60_000;

const store = new Map(); // key -> { data, fetchedAt, promise, fetcherRef }

const now = () => Date.now();

const isFresh = (entry, ttl) => entry && now() - entry.fetchedAt < ttl;

/**
 * Read a cached value without triggering a fetch.
 * Returns { data, isStale } or null when nothing is cached.
 */
export const peekQuery = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  return { data: entry.data, isStale: now() - entry.fetchedAt >= DEFAULT_TTL_MS };
};

/**
 * Fetch (or join an in-flight fetch for) `key`. Resolves with the data.
 * Concurrent callers with the same key share one network request.
 */
export const prefetchQuery = async (key, fetcher) => {
  const existing = store.get(key);
  if (existing?.promise) return existing.promise;
  if (existing && isFresh(existing, DEFAULT_TTL_MS)) return existing.data;

  const promise = Promise.resolve()
    .then(fetcher)
    .then(data => {
      const current = store.get(key);
      store.set(key, {
        data,
        fetchedAt: now(),
        promise: null,
        fetcherRef: current?.fetcherRef || fetcher,
      });
      return data;
    })
    .catch(err => {
      const current = store.get(key);
      if (current) current.promise = null;
      throw err;
    });

  const entry = store.get(key) || { data: undefined, fetchedAt: 0, fetcherRef: fetcher };
  entry.promise = promise;
  entry.fetcherRef = fetcher;
  store.set(key, entry);
  return promise;
};

/**
 * Get data if cached, otherwise undefined — never triggers I/O.
 */
export const getCached = (key) => store.get(key)?.data;

/**
 * Revalidate in the background (used for stale-while-revalidate).
 * Failures are swallowed: stale data beats no data.
 */
export const revalidate = async (key, fetcher) => {
  try {
    await prefetchQuery(key, fetcher);
  } catch {
    /* keep serving the cached value */
  }
};

/**
 * Invalidate one key (or all, with no argument). Call after mutations
 * (e.g. bookmarking) so the next read reflects the change.
 */
export const invalidateQuery = (key) => {
  if (key === undefined) {
    store.clear();
    return;
  }
  store.delete(key);
};

/** Test/inspection helper. */
export const queryCacheSize = () => store.size;
