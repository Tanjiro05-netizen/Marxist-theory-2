'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { peekQuery, revalidate } from '../lib/queryCache';

/**
 * Stale-while-revalidate data hook over the shared queryCache.
 *
 * - Cache hit: returns data synchronously on first render (no spinner),
 *   then revalidates in the background.
 * - Cache miss: `data` is undefined and `loading` is true until the fetch
 *   resolves — the caller's existing spinner states apply.
 * - `refresh()` forces a fresh fetch (returns a promise).
 *
 * `fetcher` is captured in a ref so inline arrow functions don't retrigger
 * the effect on every render.
 */
export function useCachedQuery(key, fetcher, { enabled = true } = {}) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const initial = key && enabled ? peekQuery(key) : null;
  const [data, setData] = useState(initial ? initial.data : undefined);
  const [loading, setLoading] = useState(!(initial && !initial.isStale));
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const load = useCallback(async ({ force = false } = {}) => {
    if (!key || !enabled) return;
    const cached = peekQuery(key);
    if (cached && !cached.isStale && !force) {
      setData(cached.data);
      setLoading(false);
      return cached.data;
    }
    if (cached && force === false) {
      // stale-while-revalidate: serve immediately, refresh quietly
      setData(cached.data);
      setLoading(false);
      await revalidate(key, fetcherRef.current);
      const fresh = peekQuery(key);
      if (mounted.current && fresh) setData(fresh.data);
      return fresh?.data;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await revalidate(key, fetcherRef.current).then(() => peekQuery(key));
      // revalidate swallows errors; check whether we actually got data
      const fresh = peekQuery(key);
      if (!fresh) throw new Error('Query failed');
      if (mounted.current) {
        setData(fresh.data);
        setError(null);
      }
      return fresh.data;
    } catch (e) {
      if (mounted.current && !cached) setError(e);
      if (mounted.current) setLoading(false);
      throw e;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [key, enabled]);

  useEffect(() => {
    if (!key || !enabled) return undefined;
    let cancelled = false;
    (async () => {
      const cached = peekQuery(key);
      if (cached) {
        // synchronous paint from cache, then revalidate if stale
        if (!cancelled) {
          setData(cached.data);
          setLoading(false);
        }
        if (cached.isStale) {
          await revalidate(key, fetcherRef.current);
          const fresh = peekQuery(key);
          if (!cancelled && fresh && fresh.data !== cached.data) setData(fresh.data);
        }
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        await revalidate(key, fetcherRef.current);
        const fresh = peekQuery(key);
        if (!cancelled && fresh) {
          setData(fresh.data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [key, enabled]);

  return {
    data,
    loading: loading && data === undefined,
    isValidating: loading && data !== undefined,
    error,
    refresh: useCallback(() => load({ force: true }), [load]),
  };
}

export default useCachedQuery;
