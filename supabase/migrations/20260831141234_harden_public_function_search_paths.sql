-- Pin every public function's lookup path. This includes trigger and invoker
-- functions because search_path is session-controlled even when a function is
-- not SECURITY DEFINER.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path TO public, pg_temp', fn.signature);
  END LOOP;
END $$;
