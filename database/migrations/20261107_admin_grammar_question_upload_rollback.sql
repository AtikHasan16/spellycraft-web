BEGIN;

DROP POLICY IF EXISTS "Admins insert grammar questions"
  ON public.grammar_questions;

REVOKE INSERT ON TABLE public.grammar_questions FROM PUBLIC, anon, authenticated;

COMMIT;
