-- Refuse rollback while NVIDIA NIM analytics rows still exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.ai_usage_logs
    WHERE provider = 'nvidia_nim'
  ) THEN
    RAISE EXCEPTION
      'Cannot remove NVIDIA NIM provider constraint while its usage rows exist';
  END IF;

  ALTER TABLE public.ai_usage_logs
    DROP CONSTRAINT IF EXISTS ai_usage_logs_provider_check;

  ALTER TABLE public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_provider_check
    CHECK (provider IN ('openrouter', 'mistral', 'gemini', 'groq'));
END;
$$;
