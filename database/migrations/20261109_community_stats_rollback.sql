BEGIN;

REVOKE ALL ON FUNCTION public.get_community_stats() FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.get_community_stats();

COMMIT;
