BEGIN;

REVOKE ALL ON FUNCTION public.review_community_ticket(UUID, TEXT, BOOLEAN, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_developer_application(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_developer_profile(UUID, BOOLEAN)
  FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.review_community_ticket(UUID, TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.list_my_community_tickets();
DROP FUNCTION IF EXISTS public.review_developer_application(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.review_developer_profile(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.withdraw_developer_application(UUID);
DROP FUNCTION IF EXISTS public.set_community_updated_at();

DROP TABLE IF EXISTS public.hire_proposals;
DROP TABLE IF EXISTS public.developer_profiles;
DROP TABLE IF EXISTS public.developer_application_events;
DROP TABLE IF EXISTS public.developer_applications;
DROP TABLE IF EXISTS public.community_attributions;
DROP TABLE IF EXISTS public.community_ticket_events;
DROP TABLE IF EXISTS public.community_tickets;

COMMIT;
