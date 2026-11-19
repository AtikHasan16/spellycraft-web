-- Read-only: inspect every non-internal trigger attached to auth.users.
SELECT
  trigger_row.tgname AS trigger_name,
  trigger_row.tgenabled AS enabled,
  procedure_row.oid::regprocedure AS function_name,
  pg_get_functiondef(procedure_row.oid) AS function_definition
FROM pg_trigger AS trigger_row
JOIN pg_proc AS procedure_row ON procedure_row.oid = trigger_row.tgfoid
WHERE trigger_row.tgrelid = 'auth.users'::regclass
  AND NOT trigger_row.tgisinternal
ORDER BY trigger_row.tgname;
