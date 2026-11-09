BEGIN;

DROP FUNCTION IF EXISTS public.get_community_stats();

CREATE OR REPLACE FUNCTION public.get_community_stats()
RETURNS TABLE (
  developer_count BIGINT,
  public_developer_count BIGINT,
  request_count BIGINT,
  feature_request_count BIGINT,
  problem_report_count BIGINT,
  under_review_count BIGINT,
  resolved_problem_count BIGINT,
  contributor_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.developer_profiles WHERE is_approved) AS developer_count,
    (SELECT count(*) FROM public.developer_profiles WHERE is_approved AND is_public) AS public_developer_count,
    (SELECT count(*) FROM public.community_tickets) AS request_count,
    (SELECT count(*) FROM public.community_tickets WHERE request_type = 'feature') AS feature_request_count,
    (SELECT count(*) FROM public.community_tickets WHERE request_type = 'bug') AS problem_report_count,
    (SELECT count(*) FROM public.community_tickets WHERE status IN ('pending', 'active')) AS under_review_count,
    (SELECT count(*) FROM public.community_tickets WHERE request_type = 'bug' AND status = 'resolved') AS resolved_problem_count,
    (SELECT count(*) FROM public.community_attributions WHERE is_approved AND consent_confirmed) AS contributor_count;
END;
$$;

REVOKE ALL ON FUNCTION public.get_community_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_stats() TO authenticated;

COMMIT;
