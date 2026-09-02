import { supabase } from '../supabaseClient';
import { prefetchQuery } from './queryCache';

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
    prefetchQuery('library:all', async () => {
      const [booksResponse, categoriesResponse, audiobooksResponse] = await Promise.all([
        supabase.from('digital_library_books').select('*'),
        supabase.from('digital_library_books').select('category'),
        supabase.from('audiobooks').select('*'),
      ]);
      if (booksResponse.error) throw booksResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;
      if (audiobooksResponse.error) throw audiobooksResponse.error;
      return {
        allData: booksResponse.data || [],
        categoriesData: categoriesResponse.data || [],
        audiobooksData: audiobooksResponse.data || [],
      };
    }).catch(() => {});
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

/**
 * Warm every known route's data during browser idle time after first paint,
 * so even quick keyboard navigations land on a hot cache. Skipped when the
 * user has data-saver enabled.
 */
export const prefetchAllRoutesWhenIdle = () => {
  if (typeof window === 'undefined') return;
  const saveData = window.navigator?.connection?.saveData;
  if (saveData) return;

  const run = () => Object.keys(ROUTE_QUERIES).forEach(route => {
    try {
      ROUTE_QUERIES[route]();
    } catch {
      /* best-effort */
    }
  });

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 2500);
  }
};
