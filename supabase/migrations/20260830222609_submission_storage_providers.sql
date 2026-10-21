-- Keep editorial metadata in Postgres while allowing manuscript files to live
-- in either the existing Supabase bucket or a private Cloudflare R2 bucket.

ALTER TABLE public.article_submissions
  ADD COLUMN IF NOT EXISTS storage_provider text NOT NULL DEFAULT 'supabase',
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS mime_type text;

ALTER TABLE public.article_submissions
  DROP CONSTRAINT IF EXISTS article_submissions_storage_provider_check;

ALTER TABLE public.article_submissions
  ADD CONSTRAINT article_submissions_storage_provider_check
  CHECK (storage_provider IN ('supabase', 'r2'));

ALTER TABLE public.article_submissions
  DROP CONSTRAINT IF EXISTS article_submissions_file_size_check;

ALTER TABLE public.article_submissions
  ADD CONSTRAINT article_submissions_file_size_check
  CHECK (file_size_bytes IS NULL OR file_size_bytes BETWEEN 1 AND 10485760);

CREATE INDEX IF NOT EXISTS article_submissions_review_queue_idx
  ON public.article_submissions (status, submitted_at DESC);

REVOKE ALL ON TABLE public.article_submissions FROM anon;
REVOKE ALL ON TABLE public.article_submissions FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.article_submissions TO authenticated;

DROP POLICY IF EXISTS "Admins can view all submissions" ON public.article_submissions;
CREATE POLICY "Admins can view all submissions"
  ON public.article_submissions FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update submissions" ON public.article_submissions;
CREATE POLICY "Admins can update submissions"
  ON public.article_submissions FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete submissions" ON public.article_submissions;
CREATE POLICY "Admins can delete submissions"
  ON public.article_submissions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- The bucket stays private. Authors can manage only their own top-level folder;
-- reviewers receive access through public.is_admin().
UPDATE storage.buckets
SET public = false
WHERE id = 'manuscripts';

DROP POLICY IF EXISTS "Authors upload their own manuscripts" ON storage.objects;
CREATE POLICY "Authors upload their own manuscripts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'manuscripts'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "Authors read their own manuscripts" ON storage.objects;
CREATE POLICY "Authors read their own manuscripts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'manuscripts'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Authors remove their own manuscripts" ON storage.objects;
CREATE POLICY "Authors remove their own manuscripts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'manuscripts'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      OR public.is_admin()
    )
  );
