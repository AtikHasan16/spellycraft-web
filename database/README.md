# Supabase database

- `schema.sql` creates the canonical schema and applies seed rows only when the corresponding vocabulary word/topic or grammar module/question does not already exist.
- `security_policies.sql` is seed-free and applies the current row-level security and role-protection policies.
- `migrations/20261030_phase_2_3_normalize_data_contract.sql` upgrades an existing canonical database to explicit vocabulary routing, UUID uploader/target-user IDs, and indexed vocabulary contracts.
- `migrations/20261101_phase_2_4_atomic_business_rules.sql` installs authenticated RPCs for quota-checked vocabulary inserts, atomic progress/session writes, admin role changes, and audit-log deletion.
- `migrations/20261102_phase_2_5_vocabulary_stats_rpc.sql` installs `get_vocabulary_topic_counts()` for efficient server-side grouping of vocabulary topics and counts.
- `migrations/20261108_ai_vocabulary_generation.sql` adds the preferred meaning language, localized meaning columns, an English definition column, signed AI persistence, and admin-only token/error analytics. It also creates a one-time signing secret; configure its returned value as `AI_BACKEND_SIGNING_SECRET` only on the trusted AI backend.
- `migrations/20261108_add_nvidia_nim_ai_provider.sql` allows the NVIDIA NIM provider identifier in AI usage analytics; apply it after the AI vocabulary generation migration.
- `migrations/20261108_clear_ai_usage_errors.sql` adds the admin-only RPC used by the AI Usage tab to permanently clear failed-attempt logs while preserving successful usage records and vocabulary.
- `migrations/20261109_resource_collections.sql` creates public and authenticated-only resource metadata collections with admin-only writes and Google Drive link constraints. It does not upload or delete Drive files.
- `migrations/20261109_community_hub.sql` adds the moderated community request board, contributor recognition, developer applications/profiles, and private project proposals. Public tickets and profiles are published only through the defined consent, approval, and row-level security rules; it adds no Express CRUD endpoints.
- `migrations/20261109_community_stats.sql` must be applied after the community hub migration and adds an authenticated aggregate-only RPC for community counts; it returns no ticket, profile, or other user-level records. Roll back the stats RPC before rolling back the community hub migration.
- `COMMUNITY_SETUP.md` documents migration order, frontend-to-Supabase data paths, schema-cache refresh, verification queries, and rollback cautions for the community features.

For a new project, run `schema.sql`, then run `security_policies.sql` to install
the role-checking helper before applying migrations that reference
`public.is_admin()`. Apply the migrations in order, then run
`security_policies.sql` again to restore the canonical policies. For an existing
project, do not use `schema.sql` as a migration: `CREATE TABLE IF NOT EXISTS`
does not reconcile columns on already-existing tables. Confirm the canonical
tables exist and that `security_policies.sql` has been applied, then apply new
migrations in order and rerun `security_policies.sql` when instructed. The Phase 2.3 migration
preserves legacy uploader names, backfills routing from old prefixes, and
carries UUID audit targets into `target_user_id` before dropping the legacy
`access_id` column. It aborts rather than deleting data if duplicate
`(word, topic)` rows prevent the unique index. Before applying it to an existing
project, check for conflicts with:

```sql
SELECT word, topic, COUNT(*)
FROM public.vocabularies
GROUP BY word, topic
HAVING COUNT(*) > 1;
```

The `profiles.role` values and canonical progress `user_id` columns were already
`general | admin` and UUID-backed, so this phase leaves those definitions intact.

Phase 2.4 derives the acting user and role from `auth.uid()` and the profile
table. General users are limited to 200 vocabulary inserts per UTC day; the RPC
serializes each user's quota check and inserts the vocabulary and audit record
in one transaction. Progress/session RPCs update arrays and grammar scores
atomically. Role updates and audit-log deletion are admin-checked RPCs; direct
table privileges for those operations are revoked. Admin approval and device
reset operations are not included because the current application has no
approval or device-reset workflow.

SQL in this directory is version-controlled with the frontend project. SQL
changes still need to be applied and verified in the target Supabase project;
editing these files does not deploy them. Do not apply the migrations until they
have been reviewed against the target project's live schema and duplicate rows.
