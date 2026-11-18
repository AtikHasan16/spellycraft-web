-- 20261118_vocabulary_audio_generation_rollback.sql
-- Removes the two functions added for admin bulk audio generation.
--
-- Safe to run at any time: it touches no table, column, policy, or stored data.
-- audio_url values already written stay in place; the feature simply cannot
-- read coverage or persist new URLs until the forward migration is re-applied.
--
-- Apply with the Supabase SQL editor or:
--   psql "$DATABASE_URL" -f database/migrations/20261118_vocabulary_audio_generation_rollback.sql

BEGIN;

DROP FUNCTION IF EXISTS public.set_vocabulary_audio_url(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_vocabulary_audio_counts();

COMMIT;
