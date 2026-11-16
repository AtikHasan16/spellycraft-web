BEGIN;

-- Remove notification triggers from existing tables first.
DROP TRIGGER IF EXISTS profiles_admin_registration_notification
  ON public.profiles;
DROP TRIGGER IF EXISTS community_tickets_admin_notification
  ON public.community_tickets;
DROP TRIGGER IF EXISTS developer_applications_admin_notification
  ON public.developer_applications;

-- Dropping these tables also removes their own triggers and indexes.
DROP TABLE IF EXISTS public.admin_notifications;
DROP TABLE IF EXISTS public.volunteer_applications;

DROP FUNCTION IF EXISTS public.notify_admin_volunteer_application();
DROP FUNCTION IF EXISTS public.notify_admin_registration();
DROP FUNCTION IF EXISTS public.notify_admin_community_ticket();
DROP FUNCTION IF EXISTS public.notify_admin_developer_application();
DROP FUNCTION IF EXISTS public.enforce_volunteer_application_cooldown();
DROP FUNCTION IF EXISTS public.set_volunteer_updated_at();

COMMIT;
