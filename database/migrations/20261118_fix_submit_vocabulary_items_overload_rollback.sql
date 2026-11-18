-- Rollback: Restore the legacy RPC overload.
-- WARNING: This reintroduces PostgREST PGRST203 ambiguity for named RPC calls.

BEGIN;

CREATE OR REPLACE FUNCTION public.submit_vocabulary_items(
  p_default_topic TEXT,
  p_items JSONB,
  p_target_tab TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.submit_vocabulary_items(p_items, p_default_topic, p_target_tab);
$$;

REVOKE ALL ON FUNCTION public.submit_vocabulary_items(TEXT, JSONB, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_vocabulary_items(TEXT, JSONB, TEXT)
  TO authenticated;

COMMIT;
