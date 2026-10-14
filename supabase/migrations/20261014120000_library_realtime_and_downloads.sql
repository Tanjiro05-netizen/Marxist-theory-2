-- Live library stats + accurate download counting
--
-- 1) Adds digital_library_books to the realtime publication so the catalog
--    page receives INSERT/UPDATE/DELETE events the moment they happen
--    (document/language/download stats update live; before this, the page
--    only refreshed on reload).
--
-- 2) Creates the atomic increment RPC used by recordBookDownload(). Without
--    it the client falls back to a racy read-modify-write PATCH, so apply
--    this migration before relying on the download counter.

ALTER PUBLICATION supabase_realtime ADD TABLE public.digital_library_books;

CREATE OR REPLACE FUNCTION public.increment_book_downloads(p_book_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.digital_library_books
       SET downloads = COALESCE(downloads, 0) + 1
     WHERE id = p_book_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_book_downloads(uuid) TO anon, authenticated;
