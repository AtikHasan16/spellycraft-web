BEGIN;

DROP POLICY IF EXISTS "Admins delete grammar questions"
  ON public.grammar_questions;

REVOKE DELETE ON TABLE public.grammar_questions FROM PUBLIC, anon, authenticated;

COMMIT;
