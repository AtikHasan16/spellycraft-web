-- AFTER INSERT trigger functions must return NEW on the successful path too.
-- Without it, profile creation (including signup) fails with SQLSTATE 2F005.

CREATE OR REPLACE FUNCTION public.notify_admin_volunteer_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    category, title, body, link_tab, source_table, source_id
  )
  VALUES (
    'volunteer',
    'New volunteer application',
    left(
      NEW.full_name || ' · ' ||
      CASE NEW.track
        WHEN 'software' THEN 'Software & Web Development'
        WHEN 'linguistics' THEN 'English Linguistics & Curriculum Development'
        ELSE NEW.track
      END ||
      ' · ' || NEW.country,
      600
    ),
    'volunteer',
    'volunteer_applications',
    NEW.id
  )
  ON CONFLICT (source_table, source_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create volunteer admin notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    category, title, body, link_tab, source_table, source_id
  )
  VALUES (
    'registration',
    'New candidate registered',
    left(
      COALESCE(NULLIF(btrim(NEW.name), ''), NULLIF(btrim(NEW.email), ''), 'A new learner') ||
      ' joined SpellyCraft.',
      600
    ),
    'overview',
    'profiles',
    NEW.id
  )
  ON CONFLICT (source_table, source_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create registration admin notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_community_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_category TEXT;
  v_title TEXT;
BEGIN
  v_category := CASE NEW.request_type WHEN 'bug' THEN 'bug' ELSE 'feature' END;
  v_title := CASE
    WHEN NEW.request_type = 'bug' THEN 'New bug report'
    ELSE 'New feature suggestion'
  END;

  INSERT INTO public.admin_notifications (
    category, title, body, link_tab, source_table, source_id
  )
  VALUES (
    v_category,
    v_title,
    left(NEW.title, 600),
    'community',
    'community_tickets',
    NEW.id
  )
  ON CONFLICT (source_table, source_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create community admin notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_developer_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    category, title, body, link_tab, source_table, source_id
  )
  VALUES (
    'community',
    'New developer application',
    left(NEW.display_name || ' applied to contribute as a developer.', 600),
    'community',
    'developer_applications',
    NEW.id
  )
  ON CONFLICT (source_table, source_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create developer admin notification: %', SQLERRM;
  RETURN NEW;
END;
$$;
