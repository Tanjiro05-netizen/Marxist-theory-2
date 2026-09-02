-- Allow visitors without accounts to send work for editorial review.
-- Anonymous rows intentionally have no user_id and are only visible to admins.

ALTER TABLE public.article_submissions
  ALTER COLUMN user_id DROP NOT NULL;

REVOKE ALL ON TABLE public.article_submissions FROM anon;
GRANT INSERT ON TABLE public.article_submissions TO anon;

DROP POLICY IF EXISTS "Allow anonymous submissions" ON public.article_submissions;
CREATE POLICY "Allow anonymous submissions"
  ON public.article_submissions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
