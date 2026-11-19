-- Read-only: inspect triggers on auth.users and profiles, both involved in signup.
SELECT
  trigger_row.tgrelid::regclass AS table_name,
  trigger_row.tgname AS trigger_name,
  trigger_row.tgenabled AS enabled,
  procedure_row.oid::regprocedure AS function_name,
  pg_get_functiondef(procedure_row.oid) AS function_definition
FROM pg_trigger AS trigger_row
JOIN pg_proc AS procedure_row ON procedure_row.oid = trigger_row.tgfoid
WHERE trigger_row.tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
  AND NOT trigger_row.tgisinternal
ORDER BY table_name, trigger_row.tgname;
