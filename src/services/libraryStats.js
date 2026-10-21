import { supabase } from '../supabaseClient';
import { invalidateQuery } from '../lib/queryCache';

/**
 * Records one download of a library book via the atomic
 * increment_book_downloads RPC (created by the
 * 20261014120000_library_realtime_and_downloads migration). Direct client
 * UPDATEs are not a fallback here on purpose: RLS on the table silently
 * drops them (204 with zero rows touched), so counting only works through
 * the SECURITY DEFINER function, which is granted to anon + authenticated.
 *
 * Fire-and-forget by design: a stat must never block or break the download.
 */
export async function recordBookDownload(bookId) {
    if (!bookId) return;
    try {
        const { error } = await supabase.rpc('increment_book_downloads', { p_book_id: bookId });
        if (!error) invalidateQuery('library:all');
    } catch {
        /* counting is best-effort */
    }
}
