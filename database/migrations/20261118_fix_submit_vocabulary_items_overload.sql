-- Remove the legacy argument-order overload that makes PostgREST RPC resolution ambiguous.

BEGIN;

DROP FUNCTION IF EXISTS public.submit_vocabulary_items(TEXT, JSONB, TEXT);

GRANT EXECUTE ON FUNCTION public.submit_vocabulary_items(JSONB, TEXT, TEXT)
  TO authenticated;

COMMIT;
