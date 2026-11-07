BEGIN;

ALTER TABLE public.grammar_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins insert grammar questions"
  ON public.grammar_questions;

CREATE POLICY "Admins insert grammar questions"
  ON public.grammar_questions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

REVOKE INSERT ON TABLE public.grammar_questions FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.grammar_questions TO authenticated;
GRANT SELECT ON TABLE public.grammar_questions TO anon, authenticated;

COMMIT;
