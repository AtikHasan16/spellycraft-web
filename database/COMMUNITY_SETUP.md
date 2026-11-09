# Community database setup and verification

The community frontend reads and writes data directly through Supabase PostgREST
and RPCs. It does not use the Express service for community records.

## Apply the migrations

1. In Supabase, select the correct project and open **SQL Editor**.
2. Ensure `public.is_admin()` exists by applying `security_policies.sql` as
   described in [`README.md`](./README.md). The community migration calls this
   helper for administrator-only actions.
3. Confirm that the community tables do not already exist before applying the
   schema migration. The community migration creates tables and is not safe to
   run a second time.
4. If missing, run the complete
   [`20261109_community_hub.sql`](./migrations/20261109_community_hub.sql).
5. Run the complete
   [`20261109_community_stats.sql`](./migrations/20261109_community_stats.sql).
   It drops and recreates only `get_community_stats()` so the function's return
   columns stay aligned with the current frontend.
6. Rerun `security_policies.sql` as directed by the database README, then run
   the verification queries below. Applying SQL files does not deploy the
   frontend; deploy the matching frontend build separately.

If `community_tickets`, `developer_profiles`, and
`community_attributions` already exist, do not rerun the hub migration. Run the
stats migration only. If some but not all community tables exist, stop and
inspect the Supabase schema before applying either migration.

## Verify installed objects

```sql
SELECT
  to_regclass('public.community_tickets') AS community_tickets,
  to_regclass('public.community_attributions') AS community_attributions,
  to_regclass('public.developer_applications') AS developer_applications,
  to_regclass('public.developer_profiles') AS developer_profiles,
  to_regclass('public.hire_proposals') AS hire_proposals,
  to_regprocedure('public.list_my_community_tickets()') AS my_tickets_rpc,
  to_regprocedure('public.get_community_stats()') AS stats_rpc;
```

The RPC arguments and result-column contract used by the current frontend are:

```text
list_my_community_tickets()
  -> the signed-in user's own requests, newest first (up to 50)

get_community_stats()
  -> developer_count
  -> public_developer_count
  -> request_count
  -> feature_request_count
  -> problem_report_count
  -> under_review_count
  -> resolved_problem_count
  -> contributor_count
```

The stats RPC returns aggregate counts only. It requires an authenticated
Supabase user and is not executable by `anon`. The ticket-history RPC also
filters by `auth.uid()` and is executable only by `authenticated`.

## How the frontend reads data

- **Community board:** selects from `community_tickets` where `is_public = true`
  and status is not `pending`. It requests an exact count and paginates results.
  Public visibility is set by an administrator after review.
- **Your request status:** calls `list_my_community_tickets()` and displays only
  the signed-in user's records and any resolution note.
- **Overview cards:** calls `get_community_stats()` for the eight totals shown
  on the dashboard.
- **Opt-in collaboration:** reads approved public rows from `developer_profiles`.
- **Recognition by evidence:** reads approved, consent-confirmed rows from
  `community_attributions`.
- **Recent commits:** fetched separately from the public GitHub API; it is not
  stored in Supabase and does not require a database migration.
- **Developer application/profile and proposals:** use the tables and
  admin-checked RPCs defined in the community hub migration.

All writes and private reads rely on Supabase Auth, table grants, RLS policies,
and the migration's RPC checks. Never put a `service_role` key in the frontend.

## Refresh PostgREST schema cache

After applying the migrations, refresh Supabase's PostgREST schema cache if the
frontend reports `PGRST202` (function not found) or `PGRST205` (table not
found):

```sql
NOTIFY pgrst, 'reload schema';
```

Then wait briefly and reload the app. A successful SQL Editor run does not
authenticate as an app user, so the authenticated stats RPC is expected to
reject a direct SQL Editor call when `auth.uid()` is null. Verify that RPC
through the signed-in community page instead.

## Check underlying totals (SQL Editor)

These read-only queries can help distinguish legitimate zero counts from
frontend/auth/schema-cache issues:

```sql
SELECT
  (SELECT count(*) FROM public.developer_profiles WHERE is_approved) AS approved_developers,
  (SELECT count(*) FROM public.developer_profiles WHERE is_approved AND is_public) AS public_developers,
  (SELECT count(*) FROM public.community_tickets) AS all_requests,
  (SELECT count(*) FROM public.community_tickets WHERE request_type = 'feature') AS feature_requests,
  (SELECT count(*) FROM public.community_tickets WHERE request_type = 'bug') AS problem_reports,
  (SELECT count(*) FROM public.community_tickets WHERE status IN ('pending', 'active')) AS open_or_active_requests,
  (SELECT count(*) FROM public.community_tickets WHERE request_type = 'bug' AND status = 'resolved') AS resolved_problems,
  (SELECT count(*) FROM public.community_attributions WHERE is_approved AND consent_confirmed) AS verified_contributors;
```

If the frontend still shows unavailable totals after the RPC exists and the
schema cache is refreshed, check the browser's Supabase response for an auth
error and confirm the viewer is signed in. If the count is zero in the SQL
query as well, there are currently no matching records.

## Rollback

If needed, run
[`20261109_community_stats_rollback.sql`](./migrations/20261109_community_stats_rollback.sql)
first. Roll back the community hub only after separately reviewing its rollback
script; that script drops the community tables and their data.
