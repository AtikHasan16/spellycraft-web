BEGIN;

CREATE TABLE public.community_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('feature', 'bug')),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 4 AND 140),
  description TEXT NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 4000),
  category TEXT NOT NULL DEFAULT 'General' CHECK (category IN (
    'General', 'Spelling', 'Listening', 'Reading', 'Writing', 'Speaking',
    'Vocabulary', 'Grammar', 'Accessibility', 'Other'
  )),
  steps_to_reproduce TEXT CHECK (char_length(steps_to_reproduce) <= 3000),
  expected_behavior TEXT CHECK (char_length(expected_behavior) <= 1500),
  actual_behavior TEXT CHECK (char_length(actual_behavior) <= 1500),
  affected_page TEXT CHECK (char_length(affected_page) <= 500),
  related_url TEXT CHECK (
    related_url IS NULL OR related_url ~ '^https?://'
  ),
  allow_public_credit BOOLEAN NOT NULL DEFAULT FALSE,
  public_display_name TEXT CHECK (char_length(public_display_name) <= 100),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'resolved', 'closed')),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_note TEXT CHECK (char_length(resolution_note) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_ticket_credit_consent_check CHECK (
    allow_public_credit OR public_display_name IS NULL
  ),
  CONSTRAINT community_ticket_public_status_check CHECK (
    NOT is_public OR status <> 'pending'
  ),
  CONSTRAINT community_ticket_bug_details_check CHECK (
    request_type <> 'bug'
    OR (
      NULLIF(btrim(steps_to_reproduce), '') IS NOT NULL
      AND NULLIF(btrim(expected_behavior), '') IS NOT NULL
      AND NULLIF(btrim(actual_behavior), '') IS NOT NULL
    )
  )
);

CREATE TABLE public.community_ticket_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.community_tickets(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  old_status TEXT CHECK (old_status IN ('pending', 'active', 'resolved', 'closed')),
  new_status TEXT NOT NULL CHECK (new_status IN ('pending', 'active', 'resolved', 'closed')),
  old_is_public BOOLEAN,
  new_is_public BOOLEAN NOT NULL,
  note TEXT CHECK (char_length(note) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.community_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 100),
  contribution_type TEXT NOT NULL CHECK (contribution_type IN (
    'Verified bug report', 'Implemented feature idea', 'Merged pull request',
    'Resource contribution', 'Community review', 'Other'
  )),
  summary TEXT NOT NULL CHECK (char_length(btrim(summary)) BETWEEN 1 AND 1200),
  evidence_url TEXT NOT NULL CHECK (evidence_url ~ '^https://'),
  source_ticket_id UUID REFERENCES public.community_tickets(id) ON DELETE SET NULL,
  consent_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_attribution_consent_check CHECK (
    NOT is_approved OR consent_confirmed
  )
);

CREATE TABLE public.developer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 100),
  skills TEXT NOT NULL CHECK (char_length(btrim(skills)) BETWEEN 1 AND 1500),
  experience TEXT CHECK (char_length(experience) <= 1500),
  github_url TEXT CHECK (
    github_url IS NULL OR github_url ~ '^https://github\.com/'
  ),
  portfolio_url TEXT CHECK (
    portfolio_url IS NULL OR portfolio_url ~ '^https://'
  ),
  motivation TEXT NOT NULL CHECK (char_length(btrim(motivation)) BETWEEN 10 AND 3000),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  reviewer_notes TEXT CHECK (char_length(reviewer_notes) <= 2000),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.developer_application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL
    REFERENCES public.developer_applications(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  old_status TEXT CHECK (old_status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  new_status TEXT NOT NULL
    CHECK (new_status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  note TEXT CHECK (char_length(note) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.developer_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 100),
  bio TEXT NOT NULL DEFAULT '' CHECK (char_length(bio) <= 1600),
  skills TEXT NOT NULL DEFAULT '' CHECK (char_length(skills) <= 1200),
  github_url TEXT CHECK (
    github_url IS NULL OR github_url ~ '^https://github\.com/'
  ),
  portfolio_url TEXT CHECK (
    portfolio_url IS NULL OR portfolio_url ~ '^https://'
  ),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.hire_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_description TEXT NOT NULL
    CHECK (char_length(btrim(project_description)) BETWEEN 20 AND 4000),
  deliverables TEXT NOT NULL CHECK (char_length(btrim(deliverables)) BETWEEN 5 AND 2000),
  desired_skills TEXT CHECK (char_length(desired_skills) <= 1200),
  timeline TEXT CHECK (char_length(timeline) <= 300),
  budget_range TEXT CHECK (char_length(budget_range) <= 300),
  contact_email TEXT NOT NULL CHECK (
    char_length(btrim(contact_email)) BETWEEN 3 AND 254
    AND contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'accepted', 'declined', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hire_proposal_distinct_participants CHECK (sender_id <> developer_id)
);

CREATE INDEX idx_community_tickets_public_status_created
  ON public.community_tickets (status, created_at DESC)
  WHERE is_public;
CREATE INDEX idx_community_tickets_owner_created
  ON public.community_tickets (submitted_by, created_at DESC);
CREATE INDEX idx_community_ticket_events_ticket_created
  ON public.community_ticket_events (ticket_id, created_at DESC);
CREATE INDEX idx_community_attributions_public_created
  ON public.community_attributions (created_at DESC)
  WHERE is_approved AND consent_confirmed;
CREATE INDEX idx_developer_applications_user_created
  ON public.developer_applications (user_id, created_at DESC);
CREATE INDEX idx_developer_applications_status_created
  ON public.developer_applications (status, created_at DESC);
CREATE UNIQUE INDEX idx_developer_applications_one_open_per_user
  ON public.developer_applications (user_id)
  WHERE status IN ('pending', 'under_review');
CREATE INDEX idx_hire_proposals_developer_created
  ON public.hire_proposals (developer_id, created_at DESC);
CREATE INDEX idx_hire_proposals_sender_created
  ON public.hire_proposals (sender_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_community_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER community_tickets_set_updated_at
  BEFORE UPDATE ON public.community_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_community_updated_at();
CREATE TRIGGER community_attributions_set_updated_at
  BEFORE UPDATE ON public.community_attributions
  FOR EACH ROW EXECUTE FUNCTION public.set_community_updated_at();
CREATE TRIGGER developer_applications_set_updated_at
  BEFORE UPDATE ON public.developer_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_community_updated_at();
CREATE TRIGGER developer_profiles_set_updated_at
  BEFORE UPDATE ON public.developer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_community_updated_at();
CREATE TRIGGER hire_proposals_set_updated_at
  BEFORE UPDATE ON public.hire_proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_community_updated_at();

ALTER TABLE public.community_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_proposals ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.community_tickets,
  public.community_ticket_events,
  public.community_attributions,
  public.developer_applications,
  public.developer_application_events,
  public.developer_profiles,
  public.hire_proposals
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id, request_type, title, description, category, steps_to_reproduce,
  expected_behavior, actual_behavior, affected_page, related_url,
  allow_public_credit, public_display_name, status, is_public,
  resolution_note, created_at, updated_at
) ON public.community_tickets TO authenticated;
GRANT SELECT (
  id, request_type, title, description, category, public_display_name,
  status, resolution_note, created_at
) ON public.community_tickets TO anon;
GRANT INSERT (
  request_type, title, description, category, steps_to_reproduce,
  expected_behavior, actual_behavior, affected_page, related_url,
  allow_public_credit, public_display_name
) ON public.community_tickets TO authenticated;
GRANT DELETE ON TABLE public.community_tickets TO authenticated;

CREATE POLICY "Read own admin or published community tickets"
  ON public.community_tickets FOR SELECT TO authenticated
  USING (
    submitted_by = (SELECT auth.uid())
    OR (is_public AND status <> 'pending')
    OR public.is_admin()
  );
CREATE POLICY "Read published public community tickets"
  ON public.community_tickets FOR SELECT TO anon
  USING (is_public AND status <> 'pending');
CREATE POLICY "Authenticated users submit pending tickets"
  ON public.community_tickets FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = (SELECT auth.uid())
    AND status = 'pending'
    AND is_public = FALSE
    AND resolution_note IS NULL
  );
CREATE POLICY "Users withdraw their unreviewed tickets"
  ON public.community_tickets FOR DELETE TO authenticated
  USING (submitted_by = (SELECT auth.uid()) AND status = 'pending');
CREATE POLICY "Admins update community tickets"
  ON public.community_tickets FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON TABLE public.community_ticket_events TO authenticated;
CREATE POLICY "Admins read community ticket history"
  ON public.community_ticket_events FOR SELECT TO authenticated
  USING (public.is_admin());

GRANT SELECT (
  id, display_name, contribution_type, summary, evidence_url,
  source_ticket_id, consent_confirmed, is_approved, created_at, updated_at
) ON public.community_attributions TO authenticated;
GRANT SELECT (
  id, display_name, contribution_type, summary, evidence_url,
  created_at
) ON public.community_attributions TO anon;
GRANT INSERT, UPDATE, DELETE ON TABLE public.community_attributions TO authenticated;
CREATE POLICY "Read approved consented contributor recognition"
  ON public.community_attributions FOR SELECT TO anon, authenticated
  USING (
    (is_approved AND consent_confirmed)
    OR public.is_admin()
  );
CREATE POLICY "Admins manage contributor recognition"
  ON public.community_attributions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND reviewed_by = (SELECT auth.uid()));
CREATE POLICY "Admins update contributor recognition"
  ON public.community_attributions FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete contributor recognition"
  ON public.community_attributions FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT (
  id, user_id, display_name, skills, experience, github_url, portfolio_url,
  motivation, status, reviewer_notes, created_at, updated_at
) ON public.developer_applications TO authenticated;
GRANT INSERT (
  display_name, skills, experience, github_url, portfolio_url, motivation
) ON public.developer_applications TO authenticated;
CREATE POLICY "Applicants and admins read developer applications"
  ON public.developer_applications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY "Users submit their own developer application"
  ON public.developer_applications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
    AND reviewer_notes IS NULL
    AND reviewed_by IS NULL
  );

GRANT SELECT ON TABLE public.developer_application_events TO authenticated;
CREATE POLICY "Admins read developer application history"
  ON public.developer_application_events FOR SELECT TO authenticated
  USING (public.is_admin());

GRANT SELECT (
  user_id, display_name, bio, skills, github_url, portfolio_url,
  is_public, is_approved, created_at, updated_at
) ON public.developer_profiles TO authenticated;
GRANT SELECT (
  user_id, display_name, bio, skills, github_url, portfolio_url
) ON public.developer_profiles TO anon;
GRANT INSERT (
  user_id, display_name, bio, skills, github_url, portfolio_url
) ON public.developer_profiles TO authenticated;
GRANT UPDATE (
  display_name, bio, skills, github_url, portfolio_url, is_public
) ON public.developer_profiles TO authenticated;
CREATE POLICY "Read own admin or approved public developer profiles"
  ON public.developer_profiles FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (is_approved AND is_public)
    OR public.is_admin()
  );
CREATE POLICY "Read approved public developer profiles"
  ON public.developer_profiles FOR SELECT TO anon
  USING (is_approved AND is_public);
CREATE POLICY "Approved applicants create private profiles"
  ON public.developer_profiles FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND is_public = FALSE
    AND is_approved = FALSE
    AND EXISTS (
      SELECT 1
      FROM public.developer_applications a
      WHERE a.user_id = (SELECT auth.uid())
        AND a.status = 'approved'
    )
  );
CREATE POLICY "Owners edit their developer profile"
  ON public.developer_profiles FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.developer_applications a
      WHERE a.user_id = (SELECT auth.uid()) AND a.status = 'approved'
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.developer_applications a
      WHERE a.user_id = (SELECT auth.uid()) AND a.status = 'approved'
    )
  );

GRANT SELECT ON TABLE public.hire_proposals TO authenticated;
GRANT INSERT (
  developer_id, project_description, deliverables, desired_skills,
  timeline, budget_range, contact_email
) ON public.hire_proposals TO authenticated;
GRANT UPDATE (status) ON public.hire_proposals TO authenticated;
CREATE POLICY "Proposal participants read their proposals"
  ON public.hire_proposals FOR SELECT TO authenticated
  USING (sender_id = (SELECT auth.uid()) OR developer_id = (SELECT auth.uid()));
CREATE POLICY "Users send proposals to approved public developers"
  ON public.hire_proposals FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND status = 'sent'
    AND EXISTS (
      SELECT 1 FROM public.developer_profiles p
      WHERE p.user_id = developer_id
        AND p.is_approved
        AND p.is_public
    )
  );
CREATE POLICY "Recipients respond to new proposals"
  ON public.hire_proposals FOR UPDATE TO authenticated
  USING (developer_id = (SELECT auth.uid()) AND status = 'sent')
  WITH CHECK (
    developer_id = (SELECT auth.uid())
    AND status IN ('accepted', 'declined')
  );
CREATE POLICY "Senders withdraw their proposals"
  ON public.hire_proposals FOR UPDATE TO authenticated
  USING (sender_id = (SELECT auth.uid()) AND status = 'sent')
  WITH CHECK (sender_id = (SELECT auth.uid()) AND status = 'withdrawn');

CREATE OR REPLACE FUNCTION public.list_my_community_tickets()
RETURNS TABLE (
  id UUID,
  request_type TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  affected_page TEXT,
  related_url TEXT,
  allow_public_credit BOOLEAN,
  public_display_name TEXT,
  status TEXT,
  is_public BOOLEAN,
  resolution_note TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    t.id, t.request_type, t.title, t.description, t.category,
    t.steps_to_reproduce, t.expected_behavior, t.actual_behavior,
    t.affected_page, t.related_url, t.allow_public_credit,
    t.public_display_name, t.status, t.is_public, t.resolution_note,
    t.created_at, t.updated_at
  FROM public.community_tickets AS t
  WHERE t.submitted_by = (SELECT auth.uid())
  ORDER BY t.created_at DESC
  LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.review_community_ticket(
  p_ticket_id UUID,
  p_status TEXT,
  p_is_public BOOLEAN,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS public.community_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_ticket public.community_tickets;
  v_old_status TEXT;
  v_old_public BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access is required' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('pending', 'active', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'Invalid community ticket status' USING ERRCODE = '22023';
  END IF;
  IF p_is_public AND p_status = 'pending' THEN
    RAISE EXCEPTION 'Tickets must be reviewed before publication' USING ERRCODE = '22023';
  END IF;
  IF char_length(COALESCE(p_resolution_note, '')) > 2000 THEN
    RAISE EXCEPTION 'Resolution note is too long' USING ERRCODE = '22023';
  END IF;

  SELECT status, is_public INTO v_old_status, v_old_public
  FROM public.community_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Community ticket was not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.community_tickets
  SET status = p_status,
      is_public = p_is_public,
      resolution_note = NULLIF(btrim(COALESCE(p_resolution_note, '')), '')
  WHERE id = p_ticket_id
  RETURNING * INTO v_ticket;

  INSERT INTO public.community_ticket_events (
    ticket_id, actor_id, old_status, new_status, old_is_public,
    new_is_public, note
  )
  VALUES (
    p_ticket_id, (SELECT auth.uid()), v_old_status, p_status,
    v_old_public, p_is_public, NULLIF(btrim(COALESCE(p_resolution_note, '')), '')
  );

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_developer_application(
  p_application_id UUID,
  p_status TEXT,
  p_reviewer_notes TEXT DEFAULT NULL
)
RETURNS public.developer_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_application public.developer_applications;
  v_old_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access is required' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('under_review', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid application review status' USING ERRCODE = '22023';
  END IF;
  IF char_length(COALESCE(p_reviewer_notes, '')) > 2000 THEN
    RAISE EXCEPTION 'Reviewer note is too long' USING ERRCODE = '22023';
  END IF;

  SELECT status INTO v_old_status
  FROM public.developer_applications
  WHERE id = p_application_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Developer application was not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_old_status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'Only an open application can be reviewed' USING ERRCODE = '22023';
  END IF;

  UPDATE public.developer_applications
  SET status = p_status,
      reviewer_notes = NULLIF(btrim(COALESCE(p_reviewer_notes, '')), ''),
      reviewed_by = (SELECT auth.uid())
  WHERE id = p_application_id
  RETURNING * INTO v_application;

  INSERT INTO public.developer_application_events (
    application_id, actor_id, old_status, new_status, note
  )
  VALUES (
    p_application_id, (SELECT auth.uid()), v_old_status, p_status,
    NULLIF(btrim(COALESCE(p_reviewer_notes, '')), '')
  );

  RETURN v_application;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_developer_profile(
  p_user_id UUID,
  p_is_approved BOOLEAN
)
RETURNS public.developer_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_profile public.developer_profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access is required' USING ERRCODE = '42501';
  END IF;
  IF p_is_approved AND NOT EXISTS (
    SELECT 1
    FROM public.developer_applications a
    WHERE a.user_id = p_user_id
      AND a.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'An approved developer application is required'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.developer_profiles
  SET is_approved = p_is_approved,
      reviewed_by = (SELECT auth.uid()),
      is_public = CASE WHEN p_is_approved THEN is_public ELSE FALSE END
  WHERE user_id = p_user_id
  RETURNING * INTO v_profile;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Developer profile was not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_developer_application(
  p_application_id UUID
)
RETURNS public.developer_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_application public.developer_applications;
  v_old_status TEXT;
BEGIN
  SELECT status INTO v_old_status
  FROM public.developer_applications
  WHERE id = p_application_id
    AND user_id = (SELECT auth.uid())
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Developer application was not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_old_status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'Only an open application can be withdrawn' USING ERRCODE = '22023';
  END IF;

  UPDATE public.developer_applications
  SET status = 'withdrawn'
  WHERE id = p_application_id
  RETURNING * INTO v_application;

  INSERT INTO public.developer_application_events (
    application_id, actor_id, old_status, new_status
  )
  VALUES (
    p_application_id, (SELECT auth.uid()), v_old_status, 'withdrawn'
  );

  RETURN v_application;
END;
$$;

REVOKE ALL ON FUNCTION public.set_community_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_my_community_tickets() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_community_ticket(UUID, TEXT, BOOLEAN, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_developer_application(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_developer_profile(UUID, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.withdraw_developer_application(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_community_ticket(UUID, TEXT, BOOLEAN, TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_community_tickets()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_developer_application(UUID, TEXT, TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_developer_profile(UUID, BOOLEAN)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_developer_application(UUID)
  TO authenticated;

COMMIT;
