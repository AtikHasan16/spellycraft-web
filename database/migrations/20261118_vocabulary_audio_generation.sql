-- 20261118_vocabulary_audio_generation.sql
-- Supports the admin per-topic bulk audio generation feature.
--
-- Adds exactly two functions. No table, column, or policy changes:
-- public.vocabularies stays write-protected for clients, and the only write
-- path is the admin-checked RPC below.
--
-- Apply with the Supabase SQL editor (recommended) or:
--   psql "$DATABASE_URL" -f database/migrations/20261118_vocabulary_audio_generation.sql
-- Rollback: 20261118_vocabulary_audio_generation_rollback.sql

BEGIN;

-- 1) Per-topic audio coverage for the Topic Cards tab.
--    Uploaded rows are excluded: user uploads always play through browser
--    speech, never server audio.
--    SECURITY INVOKER (the default) on purpose: an admin's RLS already exposes
--    every row, and a non-admin must not learn coverage of other people's data.
CREATE OR REPLACE FUNCTION public.get_vocabulary_audio_counts()
RETURNS TABLE (
  topic     TEXT,
  total     BIGINT,
  generated BIGINT
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT v.topic,
         count(*)::BIGINT AS total,
         count(*) FILTER (WHERE v.audio_url IS NOT NULL)::BIGINT AS generated
  FROM public.vocabularies v
  WHERE v.target_tab <> 'uploaded'
  GROUP BY v.topic;
$$;

REVOKE ALL ON FUNCTION public.get_vocabulary_audio_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_audio_counts() TO authenticated;

-- 2) Write one CDN URL to EVERY row that shares a word.
--    Reason: public.vocabularies has no client UPDATE policy, and the Express
--    route only writes the single row it was handed. Without this, a topic
--    keeps showing "missing" for a word whose MP3 already exists, and the
--    coverage count never converges.
--    SECURITY DEFINER + is_admin() keeps the write surface to one validated
--    operation instead of opening a general UPDATE policy.
CREATE OR REPLACE FUNCTION public.set_vocabulary_audio_url(
  p_word      TEXT,
  p_audio_url TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_word TEXT := btrim(COALESCE(p_word, ''));
  v_rows INTEGER := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access is required' USING ERRCODE = '42501';
  END IF;

  IF v_word = '' OR char_length(v_word) > 100 THEN
    RAISE EXCEPTION 'A word between 1 and 100 characters is required'
      USING ERRCODE = '22023';
  END IF;

  -- Only accept a public object from our own audio bucket: never store an
  -- arbitrary URL that could be used to poison the player.
  IF p_audio_url IS NULL
     OR p_audio_url !~ '^https://[^[:space:]]+/storage/v1/object/public/spelling-audio/'
  THEN
    RAISE EXCEPTION 'Audio URL must point at the spelling-audio bucket'
      USING ERRCODE = '22023';
  END IF;

  -- lower(word) = lower(v_word): the corpus stores mixed case but one word
  -- shares one MP3 regardless of how it was typed in a topic.
  -- target_tab <> 'uploaded': user uploads never receive server audio.
  -- IS DISTINCT FROM: skip rows that already hold this exact URL.
  UPDATE public.vocabularies
     SET audio_url = p_audio_url
   WHERE lower(word) = lower(v_word)
     AND target_tab <> 'uploaded'
     AND audio_url IS DISTINCT FROM p_audio_url;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

REVOKE ALL ON FUNCTION public.set_vocabulary_audio_url(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_vocabulary_audio_url(TEXT, TEXT) TO authenticated;

COMMIT;
