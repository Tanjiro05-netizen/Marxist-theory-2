-- Keep policy-only helpers out of the exposed public API schema.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

ALTER FUNCTION public.is_analysis_text_collaborator(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.is_analysis_text_owner(uuid, uuid) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.is_analysis_text_collaborator(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_analysis_text_owner(uuid, uuid) TO anon, authenticated;

-- These role predicates only read profiles, which has an explicit public-read
-- policy. Invoker security avoids turning them into privileged RPC endpoints.
ALTER FUNCTION public.is_admin() SECURITY INVOKER;
ALTER FUNCTION public.is_admin(uuid) SECURITY INVOKER;
ALTER FUNCTION public.can_manage_politics(uuid) SECURITY INVOKER;
ALTER FUNCTION public.can_manage_study() SECURITY INVOKER;
ALTER FUNCTION public.has_editorial_role(text, uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_user_role() SECURITY INVOKER;
ALTER FUNCTION public.get_member_count() SECURITY INVOKER;

-- Invite statistics are administrative data, not a public RPC.
CREATE OR REPLACE FUNCTION public.get_invite_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN json_build_object(
    'total_codes', (SELECT count(*) FROM public.invite_codes),
    'used_codes', (SELECT count(*) FROM public.invite_codes WHERE used_by IS NOT NULL),
    'available_spots', 50 - (SELECT count(*) FROM public.invite_codes WHERE used_by IS NOT NULL),
    'waitlist_count', (SELECT count(*) FROM public.waitlist)
  );
END;
$$;
