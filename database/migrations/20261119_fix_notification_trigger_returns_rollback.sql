-- Safe rollback: detach the notification triggers while preserving signup.
-- Restoring the previous function bodies would reintroduce the SQLSTATE 2F005 failure.
BEGIN;

DROP TRIGGER IF EXISTS volunteer_applications_admin_notification
  ON public.volunteer_applications;
DROP TRIGGER IF EXISTS profiles_admin_registration_notification
  ON public.profiles;
DROP TRIGGER IF EXISTS community_tickets_admin_notification
  ON public.community_tickets;
DROP TRIGGER IF EXISTS developer_applications_admin_notification
  ON public.developer_applications;

COMMIT;
