-- Allow NVIDIA NIM attempts to be recorded in AI usage analytics.
ALTER TABLE public.ai_usage_logs
  DROP CONSTRAINT IF EXISTS ai_usage_logs_provider_check;

ALTER TABLE public.ai_usage_logs
  ADD CONSTRAINT ai_usage_logs_provider_check
  CHECK (provider IN ('nvidia_nim', 'openrouter', 'mistral', 'gemini', 'groq'));
