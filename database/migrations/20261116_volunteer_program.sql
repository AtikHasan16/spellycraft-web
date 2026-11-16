BEGIN;

-- ============================================================================
-- Volunteer applications (public, login-free submissions)
-- ============================================================================

CREATE TABLE public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 1 AND 120),
  designation TEXT NOT NULL CHECK (char_length(btrim(designation)) BETWEEN 1 AND 160),
  gmail TEXT NOT NULL CHECK (
    char_length(gmail) BETWEEN 6 AND 254
    AND gmail ~* '^[a-z0-9._%+-]+@gmail\.com$'
  ),
  whatsapp TEXT NOT NULL CHECK (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  country TEXT NOT NULL CHECK (char_length(btrim(country)) BETWEEN 2 AND 80),
  track TEXT NOT NULL CHECK (track IN ('software', 'linguistics')),
  experience TEXT NOT NULL CHECK (char_length(btrim(experience)) BETWEEN 10 AND 4000),
  message TEXT NOT NULL CHECK (char_length(btrim(message)) BETWEEN 20 AND 8000),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'contacted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_volunteer_applications_status_created
  ON public.volunteer_applications (status, created_at DESC);
CREATE INDEX idx_volunteer_applications_gmail_created
  ON public.volunteer_applications (lower(gmail), created_at DESC);

CREATE OR REPLACE FUNCTION public.set_volunteer_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER volunteer_applications_set_updated_at
  BEFORE UPDATE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_volunteer_updated_at();

-- Server-enforced cooldown. The browser also keeps a 60-second cooldown, but
-- this trigger protects the public INSERT path against direct API abuse.
CREATE OR REPLACE FUNCTION public.enforce_volunteer_application_cooldown()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.volunteer_applications
    WHERE lower(gmail) = lower(NEW.gmail)
      AND created_at > NOW() - INTERVAL '10 minutes'
  ) THEN
    RAISE EXCEPTION 'A volunteer application from this Gmail address was submitted recently. Please wait before submitting again.'
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER volunteer_applications_cooldown
  BEFORE INSERT ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_volunteer_application_cooldown();

ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.volunteer_applications FROM PUBLIC, anon, authenticated;
GRANT INSERT (
  full_name, designation, gmail, whatsapp, country, track, experience, message
) ON public.volunteer_applications TO anon, authenticated;
GRANT SELECT ON TABLE public.volunteer_applications TO authenticated;
GRANT UPDATE (status) ON TABLE public.volunteer_applications TO authenticated;

CREATE POLICY "Anyone submits a pending volunteer application"
  ON public.volunteer_applications FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new');

CREATE POLICY "Admins read volunteer applications"
  ON public.volunteer_applications FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins update volunteer application status"
  ON public.volunteer_applications FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (
    public.is_admin()
    AND status IN ('new', 'reviewed', 'contacted')
  );

-- ============================================================================
-- Admin notification center (database-backed feed + read state)
-- ============================================================================

CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (
    category IN ('volunteer', 'registration', 'community', 'feature', 'bug')
  ),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  body TEXT CHECK (body IS NULL OR char_length(body) <= 600),
  link_tab TEXT NOT NULL DEFAULT 'overview'
    CHECK (link_tab IN ('overview', 'volunteer', 'community', 'ai-usage')),
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE (source_table, source_id)
);

CREATE INDEX idx_admin_notifications_unread_created
  ON public.admin_notifications (read_at, created_at DESC);
CREATE INDEX idx_admin_notifications_category_unread
  ON public.admin_notifications (category, read_at);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.admin_notifications TO authenticated;
GRANT UPDATE (read_at) ON TABLE public.admin_notifications TO authenticated;

CREATE POLICY "Admins read notifications"
  ON public.admin_notifications FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins mark notifications read"
  ON public.admin_notifications FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Notification writers. Failures are swallowed so a notification problem can
-- never block a registration, ticket, application, or volunteer submission.

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
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create developer admin notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER volunteer_applications_admin_notification
  AFTER INSERT ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_volunteer_application();

CREATE TRIGGER profiles_admin_registration_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_registration();

CREATE TRIGGER community_tickets_admin_notification
  AFTER INSERT ON public.community_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_community_ticket();

CREATE TRIGGER developer_applications_admin_notification
  AFTER INSERT ON public.developer_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_developer_application();

REVOKE ALL ON FUNCTION public.set_volunteer_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_volunteer_application_cooldown()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admin_volunteer_application()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admin_registration()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admin_community_ticket()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admin_developer_application()
  FROM PUBLIC, anon, authenticated;

COMMIT;
