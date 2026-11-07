-- AI-generated vocabulary meanings and usage analytics.
-- Existing Bangla meanings are intentionally preserved.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_meaning_language TEXT NOT NULL DEFAULT 'en';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_preferred_meaning_language_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_preferred_meaning_language_check
      CHECK (
        preferred_meaning_language IN (
          'en', 'bn', 'zh', 'hi', 'es', 'ar', 'fr', 'pt', 'id', 'ur'
        )
      );
  END IF;
END;
$$;

GRANT UPDATE (preferred_meaning_language)
  ON TABLE public.profiles TO authenticated;

ALTER TABLE public.vocabularies
  ADD COLUMN IF NOT EXISTS chinese_meaning TEXT,
  ADD COLUMN IF NOT EXISTS hindi_meaning TEXT,
  ADD COLUMN IF NOT EXISTS spanish_meaning TEXT,
  ADD COLUMN IF NOT EXISTS arabic_meaning TEXT,
  ADD COLUMN IF NOT EXISTS french_meaning TEXT,
  ADD COLUMN IF NOT EXISTS portuguese_meaning TEXT,
  ADD COLUMN IF NOT EXISTS indonesian_meaning TEXT,
  ADD COLUMN IF NOT EXISTS urdu_meaning TEXT,
  ADD COLUMN IF NOT EXISTS definition TEXT;

CREATE SCHEMA IF NOT EXISTS ai_private;
REVOKE ALL ON SCHEMA ai_private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS ai_private.signing_keys (
  key_name TEXT PRIMARY KEY,
  secret_hex TEXT NOT NULL
);
REVOKE ALL ON TABLE ai_private.signing_keys FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id UUID NOT NULL,
  provider TEXT CHECK (provider IN ('openrouter', 'mistral', 'gemini', 'groq')),
  model TEXT,
  language_code TEXT NOT NULL CHECK (
    language_code IN ('en', 'bn', 'zh', 'hi', 'es', 'ar', 'fr', 'pt', 'id', 'ur')
  ),
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_code TEXT CHECK (
    error_code IS NULL OR error_code ~ '^[A-Z0-9_]{1,64}$'
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at
  ON public.ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider_created_at
  ON public.ai_usage_logs(provider, created_at DESC);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.ai_usage_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ai_usage_logs TO authenticated;
DROP POLICY IF EXISTS "Admins read AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Admins read AI usage logs"
  ON public.ai_usage_logs FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.persist_ai_vocabulary_generation(
  p_payload TEXT,
  p_signature TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  v_payload JSONB;
  v_secret TEXT;
  v_expected_signature TEXT;
  v_user_id UUID;
  v_vocabulary_id UUID;
  v_generation_type TEXT;
  v_language TEXT;
  v_meaning TEXT;
  v_definition TEXT;
  v_generated BOOLEAN;
  v_updated_id UUID;
BEGIN
  IF p_payload IS NULL OR length(p_payload) > 12000
    OR p_signature !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid signed AI payload' USING ERRCODE = '22023';
  END IF;

  SELECT secret_hex
  INTO v_secret
  FROM ai_private.signing_keys
  WHERE key_name = 'vocabulary_generation';

  IF v_secret IS NULL OR v_secret !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'AI signing key is not configured' USING ERRCODE = '55000';
  END IF;

  IF to_regprocedure('extensions.hmac(bytea,bytea,text)') IS NOT NULL THEN
    EXECUTE
      'SELECT encode(extensions.hmac(convert_to($1, ''UTF8''), decode($2, ''hex''), ''sha256''), ''hex'')'
      INTO v_expected_signature
      USING p_payload, v_secret;
  ELSIF to_regprocedure('public.hmac(bytea,bytea,text)') IS NOT NULL THEN
    EXECUTE
      'SELECT encode(public.hmac(convert_to($1, ''UTF8''), decode($2, ''hex''), ''sha256''), ''hex'')'
      INTO v_expected_signature
      USING p_payload, v_secret;
  ELSE
    RAISE EXCEPTION 'PostgreSQL pgcrypto hmac function is unavailable'
      USING ERRCODE = '55000';
  END IF;

  IF v_expected_signature IS DISTINCT FROM p_signature THEN
    RAISE EXCEPTION 'Invalid signed AI payload' USING ERRCODE = '42501';
  END IF;

  v_payload := p_payload::JSONB;
  v_user_id := (v_payload ->> 'user_id')::UUID;
  v_generation_type := v_payload ->> 'generation_type';
  v_language := v_payload ->> 'language_code';
  v_generated := COALESCE((v_payload ->> 'generated')::BOOLEAN, FALSE);

  IF v_user_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'AI payload user does not match the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  IF v_language IS NULL
    OR v_language NOT IN ('en', 'bn', 'zh', 'hi', 'es', 'ar', 'fr', 'pt', 'id', 'ur')
    OR v_generation_type IS NULL
    OR v_generation_type NOT IN ('meaning', 'definition')
    OR jsonb_typeof(v_payload -> 'attempts') IS DISTINCT FROM 'array'
    OR jsonb_array_length(v_payload -> 'attempts') > 4 THEN
    RAISE EXCEPTION 'Invalid AI generation metadata' USING ERRCODE = '22023';
  END IF;

  IF v_generated THEN
    v_vocabulary_id := (v_payload ->> 'vocabulary_id')::UUID;
    v_meaning := NULLIF(BTRIM(v_payload ->> 'meaning'), '');
    v_definition := NULLIF(BTRIM(v_payload ->> 'definition'), '');

    IF (v_generation_type = 'meaning' AND (
        v_language IN ('en', 'bn')
        OR v_meaning IS NULL
        OR length(v_meaning) > 300
        OR v_definition IS NOT NULL
      ))
      OR (v_generation_type = 'definition' AND (
        v_language <> 'en'
        OR v_definition IS NULL
        OR length(v_definition) > 400
        OR cardinality(regexp_split_to_array(v_definition, '\s+')) > 30
        OR v_meaning IS NOT NULL
      )) THEN
      RAISE EXCEPTION 'Generated meaning or definition is invalid'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.vocabularies
    SET
      chinese_meaning = CASE WHEN v_generation_type = 'meaning' AND v_language = 'zh' THEN v_meaning ELSE chinese_meaning END,
      hindi_meaning = CASE WHEN v_generation_type = 'meaning' AND v_language = 'hi' THEN v_meaning ELSE hindi_meaning END,
      spanish_meaning = CASE WHEN v_generation_type = 'meaning' AND v_language = 'es' THEN v_meaning ELSE spanish_meaning END,
      arabic_meaning = CASE WHEN v_generation_type = 'meaning' AND v_language = 'ar' THEN v_meaning ELSE arabic_meaning END,
      french_meaning = CASE WHEN v_generation_type = 'meaning' AND v_language = 'fr' THEN v_meaning ELSE french_meaning END,
      portuguese_meaning = CASE WHEN v_generation_type = 'meaning' AND v_language = 'pt' THEN v_meaning ELSE portuguese_meaning END,
      indonesian_meaning = CASE WHEN v_generation_type = 'meaning' AND v_language = 'id' THEN v_meaning ELSE indonesian_meaning END,
      urdu_meaning = CASE WHEN v_generation_type = 'meaning' AND v_language = 'ur' THEN v_meaning ELSE urdu_meaning END,
      definition = CASE WHEN v_generation_type = 'definition' THEN v_definition ELSE definition END
    WHERE id = v_vocabulary_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
      RAISE EXCEPTION 'Vocabulary word no longer exists' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  INSERT INTO public.ai_usage_logs (
    request_id,
    provider,
    model,
    language_code,
    input_tokens,
    output_tokens,
    total_tokens,
    status,
    error_code
  )
  SELECT
    (v_payload ->> 'request_id')::UUID,
    attempt.provider,
    attempt.model,
    v_language,
    attempt.input_tokens,
    attempt.output_tokens,
    attempt.total_tokens,
    attempt.status,
    attempt.error_code
  FROM jsonb_to_recordset(v_payload -> 'attempts') AS attempt(
    provider TEXT,
    model TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    status TEXT,
    error_code TEXT
  );

  IF jsonb_array_length(v_payload -> 'attempts') = 0 THEN
    INSERT INTO public.ai_usage_logs (
      request_id, language_code, status, error_code
    )
    VALUES (
      (v_payload ->> 'request_id')::UUID,
      v_language,
      'error',
      'NO_PROVIDER_CONFIGURED'
    );
  END IF;

  RETURN v_generated;
END;
$$;

REVOKE ALL ON FUNCTION public.persist_ai_vocabulary_generation(TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.persist_ai_vocabulary_generation(TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_ai_usage_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access is required' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'today', jsonb_build_object(
      'requestCount', COUNT(DISTINCT request_id) FILTER (
        WHERE created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
      ),
      'totalTokens', COALESCE(SUM(total_tokens) FILTER (
        WHERE created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
      ), 0),
      'errorCount', COUNT(*) FILTER (
        WHERE status = 'error'
          AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
      )
    ),
    'providers', COALESCE((
      SELECT jsonb_agg(provider_totals ORDER BY provider_totals.request_count DESC)
      FROM (
        SELECT
          provider,
          COUNT(*) AS request_count,
          COALESCE(SUM(total_tokens), 0) AS total_tokens,
          COUNT(*) FILTER (WHERE status = 'error') AS error_count
        FROM public.ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND provider IS NOT NULL
        GROUP BY provider
      ) AS provider_totals
    ), '[]'::JSONB),
    'recentErrors', COALESCE((
      SELECT jsonb_agg(error_entry ORDER BY error_entry.created_at DESC)
      FROM (
        SELECT request_id, provider, model, language_code, error_code, created_at
        FROM public.ai_usage_logs
        WHERE status = 'error'
        ORDER BY created_at DESC
        LIMIT 100
      ) AS error_entry
    ), '[]'::JSONB)
  )
  INTO v_result
  FROM public.ai_usage_logs;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.get_ai_usage_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_summary() TO authenticated;

-- Run this once after applying the migration. Copy the returned value into
-- AI_BACKEND_SIGNING_SECRET on the AI service host; never expose or commit it.
INSERT INTO ai_private.signing_keys (key_name, secret_hex)
VALUES (
  'vocabulary_generation',
  replace(gen_random_uuid()::TEXT, '-', '') || replace(gen_random_uuid()::TEXT, '-', '')
)
ON CONFLICT (key_name) DO NOTHING
RETURNING secret_hex;
