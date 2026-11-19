-- Migration: Add speaking, reading, and writing vocabulary destinations.

BEGIN;

DO $$
DECLARE
  check_constraint_name TEXT;
BEGIN
  SELECT conname
  INTO check_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.vocabularies'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%target_tab%'
  LIMIT 1;

  IF check_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.vocabularies DROP CONSTRAINT %I',
      check_constraint_name
    );
  END IF;

  ALTER TABLE public.vocabularies
    ADD CONSTRAINT vocabularies_target_tab_check
    CHECK (
      target_tab IN (
        'active',
        'listening',
        'uploaded',
        'speaking',
        'reading',
        'writing'
      )
    );
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabularies_word_topic_target_tab
  ON public.vocabularies(word, topic, target_tab);

DROP INDEX IF EXISTS public.idx_vocabularies_word_topic;

DROP FUNCTION IF EXISTS public.submit_vocabulary_items(TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.submit_vocabulary_items(
  p_items JSONB,
  p_default_topic TEXT,
  p_target_tab TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role TEXT;
  v_user_name TEXT;
  v_target_tab TEXT := LOWER(BTRIM(p_target_tab));
  v_default_topic TEXT := COALESCE(NULLIF(BTRIM(p_default_topic), ''), 'Uploaded');
  v_item JSONB;
  v_word TEXT;
  v_pos TEXT;
  v_bangla_meaning TEXT;
  v_topic TEXT;
  v_example_usage TEXT;
  v_synonyms TEXT[];
  v_inserted public.vocabularies%ROWTYPE;
  v_inserted_items JSONB := '[]'::JSONB;
  v_request_count INTEGER;
  v_daily_count BIGINT;
  v_day_start TIMESTAMPTZ;
  v_action TEXT;
  v_details TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to upload vocabulary'
      USING ERRCODE = '42501';
  END IF;

  IF p_items IS NULL OR JSONB_TYPEOF(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Vocabulary items must be provided as an array'
      USING ERRCODE = '22023';
  END IF;

  v_request_count := JSONB_ARRAY_LENGTH(p_items);
  IF v_request_count = 0 THEN
    RAISE EXCEPTION 'At least one vocabulary item is required'
      USING ERRCODE = '22023';
  END IF;

  IF v_target_tab IS NULL OR v_target_tab NOT IN (
    'active',
    'listening',
    'uploaded',
    'speaking',
    'reading',
    'writing'
  ) THEN
    RAISE EXCEPTION 'Invalid vocabulary destination'
      USING ERRCODE = '22023';
  END IF;

  SELECT profile.role, profile.name
  INTO v_role, v_user_name
  FROM public.profiles AS profile
  WHERE profile.id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A profile is required to upload vocabulary'
      USING ERRCODE = '42501';
  END IF;

  IF v_role <> 'admin' AND v_target_tab <> 'uploaded' THEN
    RAISE EXCEPTION 'General users may only upload to the Uploaded tab'
      USING ERRCODE = '42501';
  END IF;

  IF v_role <> 'admin' THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('vocabulary_upload:' || v_user_id::TEXT, 0)
    );

    v_day_start :=
      pg_catalog.date_trunc('day', pg_catalog.clock_timestamp() AT TIME ZONE 'UTC')
      AT TIME ZONE 'UTC';

    SELECT COUNT(*)
    INTO v_daily_count
    FROM public.vocabularies
    WHERE uploaded_by_id = v_user_id
      AND created_at >= v_day_start
      AND created_at < v_day_start + INTERVAL '1 day';

    IF v_daily_count + v_request_count > 200 THEN
      RAISE EXCEPTION
        'Daily upload limit exceeded. % words uploaded today; % remain (limit: 200).',
        v_daily_count,
        GREATEST(0, 200 - v_daily_count)
        USING ERRCODE = '22023';
    END IF;
  END IF;

  FOR v_item IN
    SELECT item.value
    FROM JSONB_ARRAY_ELEMENTS(p_items) AS item(value)
  LOOP
    IF JSONB_TYPEOF(v_item) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Each vocabulary item must be an object'
        USING ERRCODE = '22023';
    END IF;

    v_word := NULLIF(BTRIM(v_item ->> 'word'), '');
    v_bangla_meaning := NULLIF(BTRIM(v_item ->> 'bangla_meaning'), '');
    IF v_word IS NULL OR v_bangla_meaning IS NULL THEN
      RAISE EXCEPTION 'Each vocabulary item requires a word and meaning'
        USING ERRCODE = '22023';
    END IF;

    v_pos := COALESCE(NULLIF(BTRIM(v_item ->> 'pos'), ''), 'Unknown');
    v_topic := COALESCE(
      NULLIF(BTRIM(v_item ->> 'topic'), ''),
      v_default_topic
    );
    v_example_usage := COALESCE(BTRIM(v_item ->> 'example_usage'), '');

    IF JSONB_TYPEOF(v_item -> 'synonyms') = 'array' THEN
      SELECT COALESCE(
        ARRAY_AGG(synonym.value),
        ARRAY[]::TEXT[]
      )
      INTO v_synonyms
      FROM JSONB_ARRAY_ELEMENTS_TEXT(v_item -> 'synonyms') AS synonym(value);
    ELSE
      v_synonyms := ARRAY[]::TEXT[];
    END IF;

    INSERT INTO public.vocabularies (
      word,
      pos,
      bangla_meaning,
      synonyms,
      example_usage,
      topic,
      target_tab,
      uploaded_by_id,
      uploaded_by_name
    )
    VALUES (
      v_word,
      v_pos,
      v_bangla_meaning,
      v_synonyms,
      v_example_usage,
      v_topic,
      v_target_tab,
      v_user_id,
      v_user_name
    )
    RETURNING * INTO v_inserted;

    v_inserted_items := v_inserted_items || JSONB_BUILD_ARRAY(TO_JSONB(v_inserted));
  END LOOP;

  IF v_request_count = 1 THEN
    v_action := 'VOCAB_UPLOADED';
    v_details := FORMAT(
      'Uploaded word "%s" to topic "%s" [tab: %s]',
      v_inserted.word,
      v_inserted.topic,
      v_target_tab
    );
  ELSE
    v_action := 'VOCAB_BULK_UPLOAD';
    v_details := FORMAT(
      'Bulk imported %s words under "%s" [tab: %s]',
      v_request_count,
      v_default_topic,
      v_target_tab
    );
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    details
  )
  VALUES (
    v_user_id,
    v_user_name,
    v_action,
    v_details
  );

  RETURN JSONB_BUILD_OBJECT(
    'count', v_request_count,
    'items', v_inserted_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_vocabulary_items(JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_vocabulary_items(JSONB, TEXT, TEXT)
  TO authenticated;

COMMIT;
