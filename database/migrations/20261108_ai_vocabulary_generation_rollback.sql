REVOKE ALL ON FUNCTION public.get_ai_usage_summary() FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.get_ai_usage_summary();

REVOKE ALL ON FUNCTION public.persist_ai_vocabulary_generation(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.persist_ai_vocabulary_generation(TEXT, TEXT);

DROP POLICY IF EXISTS "Admins read AI usage logs" ON public.ai_usage_logs;
DROP TABLE IF EXISTS public.ai_usage_logs;

DROP TABLE IF EXISTS ai_private.signing_keys;
DROP SCHEMA IF EXISTS ai_private;

REVOKE UPDATE (preferred_meaning_language)
  ON TABLE public.profiles FROM authenticated;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_preferred_meaning_language_check;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS preferred_meaning_language;

ALTER TABLE public.vocabularies
  DROP COLUMN IF EXISTS chinese_meaning,
  DROP COLUMN IF EXISTS hindi_meaning,
  DROP COLUMN IF EXISTS spanish_meaning,
  DROP COLUMN IF EXISTS arabic_meaning,
  DROP COLUMN IF EXISTS french_meaning,
  DROP COLUMN IF EXISTS portuguese_meaning,
  DROP COLUMN IF EXISTS indonesian_meaning,
  DROP COLUMN IF EXISTS urdu_meaning,
  DROP COLUMN IF EXISTS definition;
