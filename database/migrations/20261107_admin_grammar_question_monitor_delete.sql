BEGIN;

ALTER TABLE public.grammar_questions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'grammar_questions'
      AND cmd IN ('DELETE', 'ALL')
  LOOP
    EXECUTE FORMAT(
      'DROP POLICY %I ON public.grammar_questions',
      existing_policy.policyname
    );
  END LOOP;
END;
$$;

CREATE POLICY "Admins delete grammar questions"
  ON public.grammar_questions FOR DELETE TO authenticated
  USING (public.is_admin());

REVOKE DELETE ON TABLE public.grammar_questions FROM PUBLIC, anon, authenticated;
GRANT DELETE ON TABLE public.grammar_questions TO authenticated;

COMMIT;
