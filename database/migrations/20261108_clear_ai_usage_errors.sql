CREATE OR REPLACE FUNCTION public.clear_ai_usage_errors()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access is required'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.ai_usage_logs
  WHERE status = 'error';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_ai_usage_errors() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_ai_usage_errors() TO authenticated;
