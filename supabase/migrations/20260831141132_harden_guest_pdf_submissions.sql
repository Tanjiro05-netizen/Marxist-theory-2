-- Harden guest manuscript intake. Browser clients may read only the editorial
-- taxonomy and their own submission metadata; all writes happen through the
-- server with the service role after bot, rate-limit, and file validation.

-- A legacy policy created in the dashboard used `USING (true)` for every
-- bucket, making even private manuscript objects public.
DROP POLICY IF EXISTS "Public read access 1oj01fe_0" ON storage.objects;

UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[]
WHERE id = 'manuscripts';

-- Signed upload targets are now minted only by the trusted application server.
DROP POLICY IF EXISTS "Allow anonymous manuscript uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authors upload their own manuscripts" ON storage.objects;
DROP POLICY IF EXISTS "Authors read their own manuscripts" ON storage.objects;
DROP POLICY IF EXISTS "Authors remove their own manuscripts" ON storage.objects;

DROP POLICY IF EXISTS "Allow anonymous submissions" ON public.article_submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.article_submissions;

REVOKE INSERT ON TABLE public.article_submissions FROM anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.article_submissions TO authenticated;

ALTER TABLE public.article_submissions
  ADD COLUMN IF NOT EXISTS scan_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS safe_file_path text,
  ADD COLUMN IF NOT EXISTS file_sha256 text,
  ADD COLUMN IF NOT EXISTS scan_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scanned_at timestamptz;

-- Existing files have not been scanned by the new pipeline and must not be
-- previewed merely because they predate it.
UPDATE public.article_submissions
SET scan_status = 'legacy_unscanned'
WHERE scan_status = 'pending'
  AND submitted_at < now() - interval '1 minute';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'article_submissions_scan_status_check'
      AND conrelid = 'public.article_submissions'::regclass
  ) THEN
    ALTER TABLE public.article_submissions
      ADD CONSTRAINT article_submissions_scan_status_check
      CHECK (scan_status IN (
        'pending', 'scanning', 'clean', 'infected', 'failed', 'legacy_unscanned'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'article_submissions_pdf_mime_check'
      AND conrelid = 'public.article_submissions'::regclass
  ) THEN
    ALTER TABLE public.article_submissions
      ADD CONSTRAINT article_submissions_pdf_mime_check
      CHECK (mime_type IS NULL OR mime_type = 'application/pdf') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'article_submissions_approval_requires_clean_scan'
      AND conrelid = 'public.article_submissions'::regclass
  ) THEN
    ALTER TABLE public.article_submissions
      ADD CONSTRAINT article_submissions_approval_requires_clean_scan
      CHECK (status <> 'approved' OR scan_status = 'clean') NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS article_submissions_scan_queue_idx
  ON public.article_submissions (scan_status, submitted_at DESC);

CREATE TABLE IF NOT EXISTS public.submission_upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('supabase', 'r2')),
  object_key text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  expected_size bigint NOT NULL CHECK (expected_size BETWEEN 1 AND 10485760),
  expected_mime text NOT NULL DEFAULT 'application/pdf'
    CHECK (expected_mime = 'application/pdf'),
  ip_hash text NOT NULL,
  turnstile_hostname text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'consumed', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.submission_upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_upload_sessions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.submission_upload_sessions FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS submission_upload_sessions_rate_limit_idx
  ON public.submission_upload_sessions (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS submission_upload_sessions_expiry_idx
  ON public.submission_upload_sessions (status, expires_at);
CREATE INDEX IF NOT EXISTS submission_upload_sessions_user_id_idx
  ON public.submission_upload_sessions (user_id);

CREATE TABLE IF NOT EXISTS public.submission_scan_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.article_submissions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'clean', 'infected', 'failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 20),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  last_error text,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id)
);

ALTER TABLE public.submission_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_scan_jobs FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.submission_scan_jobs FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS submission_scan_jobs_work_idx
  ON public.submission_scan_jobs (status, available_at);
CREATE INDEX IF NOT EXISTS submission_scan_jobs_submission_id_idx
  ON public.submission_scan_jobs (submission_id);

-- These two relationship tables were accidentally left fully writable through
-- the Data API. Keep their intended public-read/admin-write behavior under RLS.
ALTER TABLE public.knowledge_quiz_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_scenario_concepts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.knowledge_quiz_concepts FROM anon, authenticated;
REVOKE ALL ON TABLE public.knowledge_scenario_concepts FROM anon, authenticated;
GRANT SELECT ON TABLE public.knowledge_quiz_concepts TO anon, authenticated;
GRANT SELECT ON TABLE public.knowledge_scenario_concepts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.knowledge_quiz_concepts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.knowledge_scenario_concepts TO authenticated;

DROP POLICY IF EXISTS "Concept links are readable" ON public.knowledge_quiz_concepts;
CREATE POLICY "Concept links are readable"
  ON public.knowledge_quiz_concepts FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage quiz concept links" ON public.knowledge_quiz_concepts;
CREATE POLICY "Admins manage quiz concept links"
  ON public.knowledge_quiz_concepts FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Scenario concept links are readable" ON public.knowledge_scenario_concepts;
CREATE POLICY "Scenario concept links are readable"
  ON public.knowledge_scenario_concepts FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage scenario concept links" ON public.knowledge_scenario_concepts;
CREATE POLICY "Admins manage scenario concept links"
  ON public.knowledge_scenario_concepts FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Postgres 15 supports invoker-security views, so the caller's RLS policies are
-- honored instead of the view owner's privileges.
DO $$
BEGIN
  IF to_regclass('public.knowledge_trending_questions') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.knowledge_trending_questions SET (security_invoker = true)';
  END IF;
END $$;

-- Fix search-path mutability on privileged functions. Keeping `public` first
-- preserves legacy unqualified references while preventing temp-object shadowing.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path TO public, pg_temp', fn.signature);
  END LOOP;
END $$;

-- Trigger functions are invoked by their triggers; browser roles never need to
-- call them directly as RPC endpoints.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',
      fn.signature
    );
  END LOOP;
END $$;

-- These helpers are used only by authenticated RLS policies.
REVOKE EXECUTE ON FUNCTION public.can_manage_politics(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_study() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_editorial_role(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_politics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_study() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_editorial_role(text, uuid) TO authenticated;

-- Prevent arbitrary XP grants through the Data API.
REVOKE EXECUTE ON FUNCTION public.update_user_xp(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_xp(uuid, integer) TO service_role;

-- Invite redemption must always target the authenticated caller, never an
-- arbitrary user ID supplied by the browser.
CREATE OR REPLACE FUNCTION public.use_invite_code(p_code text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_invite_id uuid;
  v_used_count integer;
  v_code text := upper(trim(p_code));
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  LOCK TABLE public.invite_codes IN SHARE ROW EXCLUSIVE MODE;

  SELECT count(*) INTO v_used_count
  FROM public.invite_codes
  WHERE used_by IS NOT NULL;

  IF v_used_count >= 50 THEN
    RETURN json_build_object('success', false, 'error', 'All invite spots have been filled');
  END IF;

  UPDATE public.invite_codes
  SET used_at = now(), used_by = auth.uid(), is_active = false
  WHERE code = v_code
    AND is_active = true
    AND used_by IS NULL
  RETURNING id INTO v_invite_id;

  IF v_invite_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or already used invite code');
  END IF;

  UPDATE public.profiles
  SET has_invite_access = true, invite_code_used = v_code
  WHERE id = auth.uid();

  RETURN json_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.use_invite_code(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.use_invite_code(text, uuid) TO authenticated;

-- The rate helper used to accept any user ID. Bind it to the JWT subject.
CREATE OR REPLACE FUNCTION public.check_forum_rate_limit(p_user_id uuid, p_action_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  recent_count integer;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;

  IF p_action_type = 'thread' THEN
    SELECT count(*) INTO recent_count
    FROM public.forum_threads
    WHERE author_id = auth.uid()
      AND created_at > now() - interval '10 minutes';
    RETURN recent_count < 5;
  ELSIF p_action_type = 'comment' THEN
    SELECT count(*) INTO recent_count
    FROM public.forum_comments
    WHERE author_id = auth.uid()
      AND created_at > now() - interval '5 minutes';
    RETURN recent_count < 15;
  END IF;

  RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_forum_rate_limit(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_forum_rate_limit(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_invite_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_invite_stats() TO authenticated;
