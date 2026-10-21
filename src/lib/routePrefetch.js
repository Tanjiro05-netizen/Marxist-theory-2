import { supabase } from '../supabaseClient';
import { prefetchQuery } from './queryCache';
import { fetchLibraryCatalog } from './libraryQueries';

/**
 * Warms the query cache for a route before the user clicks its nav link
 * (mouse enter / focus / touch). Next.js already prefetches route CHUNKS
 * on viewport in production; this prefetches the DATA to match, so the
 * destination paints with content immediately. Fire-and-forget.
 */

const ROUTE_QUERIES = {
  '/theory': () => {
    prefetchQuery('theory:categories', async () => {
      const { data, error } = await supabase
        .from('theory_categories')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    }).catch(() => {});
    prefetchQuery('theory:community', async () => {
      const { data, error } = await supabase
        .from('analysis_texts')
        .select('id, slug, primary_language, metadata, category, tags, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }).catch(() => {});
  },
  '/study': () => {
    const tables = [
      ['study:resources', 'study_resources'],
      ['study:concepts', 'study_concepts'],
      ['study:milestones', 'study_milestones'],
    ];
    tables.forEach(([key, table]) => {
      prefetchQuery(key, async () => {
        const { data, error } = await supabase.from(table).select('*').order('sort_order');
        if (error) throw error;
        return data || [];
      }).catch(() => {});
    });
  },
  '/digital-library': () => {
    prefetchQuery('library:all', fetchLibraryCatalog).catch(() => {});
  },
};

export const prefetchRouteData = (path) => {
  if (!path) return;
  const match = Object.keys(ROUTE_QUERIES).find(route => path === route || path.startsWith(`${route}/`));
  if (match) {
    try {
      ROUTE_QUERIES[match]();
    } catch {
      /* prefetching is best-effort */
    }
  }
};

/* Routes already warmed in this session — the sweep is worth running once,
   not on every navigation. */
const swept = new Set();

const QUIET_AFTER_LOAD_MS = 1500;
const BETWEEN_ROUTES_MS = 400;

const whenIdle = (fn, timeout) => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout });
  else setTimeout(fn, Math.min(timeout, 1000));
};

/**
 * Warm every other route's data once the current page has finished its own
 * work, so a later navigation lands on a hot cache.
 *
 * The timing matters more than it looks. Firing these on first paint put
 * eight queries on the wire beside the ones the page the reader is actually
 * looking at needs — on a book, that pushed the EPUB download back by
 * seconds. So: wait for load, then for the browser to go quiet, then walk
 * the routes one at a time rather than opening them all at once, and skip
 * whichever route is already on screen (it is fetching for itself).
 */
export const prefetchAllRoutesWhenIdle = () => {
  if (typeof window === 'undefined') return;
  const connection = window.navigator?.connection;
  if (connection?.saveData) return;
  /* Nothing speculative over a slow link — it would compete with the page. */
  if (/(^|-)2g$/.test(connection?.effectiveType || '')) return;

  const sweep = () => {
    const here = window.location?.pathname || '';
    const routes = Object.keys(ROUTE_QUERIES).filter(
      (route) => !swept.has(route) && !(here === route || here.startsWith(`${route}/`))
    );

    /* One route per idle slice: a queue the browser can interleave with
       whatever the reader is doing, not a burst. */
    const next = () => {
      const route = routes.shift();
      if (!route) return;
      swept.add(route);
      try {
        ROUTE_QUERIES[route]();
      } catch {
        /* best-effort */
      }
      setTimeout(() => whenIdle(next, 4000), BETWEEN_ROUTES_MS);
    };

    whenIdle(next, 4000);
  };

  const start = () => setTimeout(sweep, QUIET_AFTER_LOAD_MS);

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
};
