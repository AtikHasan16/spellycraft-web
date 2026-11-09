CREATE TABLE public.public_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 140),
  category TEXT NOT NULL CHECK (category IN (
    'Spelling',
    'Listening',
    'Reading',
    'Writing',
    'Speaking',
    'Vocabulary',
    'Grammar',
    'Pronunciation',
    'Exam Strategy',
    'Other'
  )),
  short_description TEXT NOT NULL
    CHECK (char_length(btrim(short_description)) BETWEEN 1 AND 600),
  drive_url TEXT NOT NULL CHECK (
    drive_url ~ '^https://(drive\.google\.com|docs\.google\.com)/'
  ),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.private_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 140),
  category TEXT NOT NULL CHECK (category IN (
    'Spelling',
    'Listening',
    'Reading',
    'Writing',
    'Speaking',
    'Vocabulary',
    'Grammar',
    'Pronunciation',
    'Exam Strategy',
    'Other'
  )),
  short_description TEXT NOT NULL
    CHECK (char_length(btrim(short_description)) BETWEEN 1 AND 600),
  drive_url TEXT NOT NULL CHECK (
    drive_url ~ '^https://(drive\.google\.com|docs\.google\.com)/'
  ),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_public_resources_category_created
  ON public.public_resources (category, created_at DESC);
CREATE INDEX idx_private_resources_category_created
  ON public.private_resources (category, created_at DESC);

ALTER TABLE public.public_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_resources ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.public_resources, public.private_resources
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.public_resources TO anon, authenticated;
GRANT SELECT ON TABLE public.private_resources TO authenticated;
GRANT INSERT, DELETE ON TABLE public.public_resources, public.private_resources
  TO authenticated;

CREATE POLICY "Anyone can read public resources"
  ON public.public_resources FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins create public resources"
  ON public.public_resources FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND created_by = (SELECT auth.uid()));

CREATE POLICY "Admins delete public resources"
  ON public.public_resources FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Authenticated users can read private resources"
  ON public.private_resources FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins create private resources"
  ON public.private_resources FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND created_by = (SELECT auth.uid()));

CREATE POLICY "Admins delete private resources"
  ON public.private_resources FOR DELETE TO authenticated
  USING (public.is_admin());
