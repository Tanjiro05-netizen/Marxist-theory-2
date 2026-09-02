-- Raise guest manuscript uploads to 50 MiB. Supabase Free projects cap the
-- global file-size limit at 50 MB; keep this per-bucket limit aligned with
-- the application and scanner guards.
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'manuscripts';

ALTER TABLE public.article_submissions
  DROP CONSTRAINT IF EXISTS article_submissions_file_size_check;

ALTER TABLE public.article_submissions
  ADD CONSTRAINT article_submissions_file_size_check
  CHECK (file_size_bytes IS NULL OR file_size_bytes BETWEEN 1 AND 52428800);

ALTER TABLE public.submission_upload_sessions
  DROP CONSTRAINT IF EXISTS submission_upload_sessions_expected_size_check;

ALTER TABLE public.submission_upload_sessions
  ADD CONSTRAINT submission_upload_sessions_expected_size_check
  CHECK (expected_size BETWEEN 1 AND 52428800);
