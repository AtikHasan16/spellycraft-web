# Implementation Prompt — Per-Topic Bulk Audio Generation

> Hand this whole file to an implementing agent. Every constraint below was
> agreed with the product owner and derived from the current codebase; do not
> "improve" a decision without asking.

---

## 1. Objective

Add a **per-topic "Generate missing audio" control** to the Topic Cards tab of
`src/pages/VocabMonitorPage.jsx`. Each topic row shows `generated / total` audio
coverage and a button that generates the missing MP3s by calling the existing
`POST /api/audio/synthesize` endpoint once per word, **sequentially, from the
admin's browser, against a locally running backend**.

The database is the progress bar. `audio_url IS NULL` means "still missing".
There is no job table, no queue, no status column, and no server-side loop.

---

## 2. Hard scope (non-goals)

These are deliberate. Do not add them.

| Not allowed | Why |
|---|---|
| A new Express route such as `POST /api/audio/generate-topic` | `spellycraft-server/AGENTS.md` §3 forbids CRUD/bulk/topic endpoints on Express. The server keeps exactly one behaviour: one word in, one MP3 out. |
| A standalone Node/Python script | Owner chose the browser path. One code path only. |
| A `service_role` key anywhere in frontend code | `AGENTS.md` §3. |
| A background job, cron, or webhook | Out of scope for this change. |
| Auto-generation when vocabularies are imported | Not requested. |
| Generating audio for `target_tab = 'uploaded'` rows | Uploaded words always use browser `speechSynthesis`. Filter them out everywhere. |
| Re-synthesising a word that already has audio somewhere | Wasted quota and duplicate storage objects. |
| Parallel requests (2, 5, 20 at a time) | Serial only: the upstream is unofficial, and the server caps this user at 30 TTS calls/minute. |
| Touching `get_vocabulary_topic_counts()` | Used by `vocabularyService.getVocabularyStats()`. Add a new function instead. |

---

## 3. Manual steps for the human (the agent must not do these)

Five copy-paste items. The implementing agent stops here and hands over.

### 3.1 Review and apply the migration

`AGENTS.md` §4 requires a human-reviewed diff for anything in
`database/migrations/*`. The two files already exist in this repo:

- `database/migrations/20261118_vocabulary_audio_generation.sql`
- `database/migrations/20261118_vocabulary_audio_generation_rollback.sql`

Apply the forward file **one of two ways**.

**Supabase SQL editor** (recommended — no database password on disk):

1. Supabase Dashboard → SQL Editor → New query.
2. Paste the entire forward file → **Run**. It is wrapped in `BEGIN … COMMIT`,
   so it applies fully or not at all.

**`psql`** (you supply the connection string yourself; never commit it):

```bash
cd spellycraft-web
psql "$DATABASE_URL" -f database/migrations/20261118_vocabulary_audio_generation.sql
```

Verify the read function in the SQL editor:

```sql
-- One row per non-uploaded topic. Raises "function does not exist" if step 1
-- did not run, which is exactly the signal you want.
select * from public.get_vocabulary_audio_counts() order by topic limit 5;
```

Do **not** probe `set_vocabulary_audio_url()` from the SQL editor. The editor
runs without a JWT, so `auth.uid()` is null, `public.is_admin()` is false, and
the call correctly raises `42501`. Test the write path from the app instead
(§12.10 covers the non-admin case).

Rollback at any time — it drops only the two functions and leaves already
written `audio_url` values in place:

```bash
psql "$DATABASE_URL" -f database/migrations/20261118_vocabulary_audio_generation_rollback.sql
```

### 3.2 Confirm the `spelling-audio` bucket is public

That bucket was created by hand and is **not** in `database/`, so no migration
guarantees it. Supabase Dashboard → Storage → `spelling-audio` must exist and be
**public**, otherwise `getPublicUrl` hands learners a URL that 404s.

### 3.3 CORS — required for the local bulk run

The allowlist is env-driven (`spellycraft-server/index.js:58`) and defaults to
`http://localhost:5173` only. Vite falls back to **5174** whenever 5173 is busy,
and then every synth call dies at preflight with a CORS error.

`spellycraft-server/.env.example` now documents both ports. Put the same line in
your real `spellycraft-server/.env`:

```
CORS_ORIGINS=https://spellycraft.com,https://www.spellycraft.com,http://localhost:5173,http://localhost:5174
```

Restart `npm run dev` in the server. Do not use a wildcard, and never set
`NODE_ENV=production` locally — `index.js:50` throws when `CORS_ORIGINS` is
missing in production.

### 3.4 Point the web app at the local backend

`spellycraft-web/.env.example` now documents the correct local port (`5000`, not
the stale `5001`). In your real `spellycraft-web/.env` or a gitignored
`.env.local`:

```
VITE_BACKEND_URL=http://localhost:5000
```

Without this the entire run is sent to Render/Vercel — the exact thing this
feature exists to avoid. Vite restarts itself when env files change.

### 3.5 Start both projects and sign in as admin

```bash
# terminal 1
cd spellycraft-server && npm run dev      # http://localhost:5000

# terminal 2
cd spellycraft-web && npm run dev         # http://localhost:5173 (or 5174)
```

Sign in with an admin account. Every other account fails the `is_admin()` guard
inside the write RPC and sees empty coverage counts.

---

## 4. Two facts about the current server that shape the design

Read these before writing a line of code.

### 4.1 The endpoint already does cross-topic reuse — but writes only one row

`handleAudioCache` in `spellycraft-server/index.js`:

1. If `vocabId` is given and that row has `audio_url` → return it (`cached: true`).
2. Else look up **any** row with the same word that has audio
   (`ilike("word", ...)` + `.not("audio_url", "is", null)`) → return it
   (`cached: true`).
3. Else synthesize → upload to `spelling-audio` → `getPublicUrl`.
4. Then update **one** row, only `if (targetVocabId && publicCdnUrl)`.

**Therefore: send `{ word, voice }` and do NOT send `vocabId`.**

Reason: `safeName` is `${targetVocabId}.mp3` when `vocabId` is present, otherwise
`${word}.mp3`. Sending the row id would create one file **per topic row** for the
same word, and would still leave every other row's `audio_url` null. Sending the
word gives one deterministic object per word (`analyze.mp3`), and the server
skips its DB write entirely (`targetVocabId` stays null), so the client owns the
write. That single client write path is what makes fresh generation and cache
reuse behave identically.

### 4.2 The per-user rate limiter caps this at 30 requests/minute — so pace at 30/minute

```js
// spellycraft-server/index.js:168
const ttsUserLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, keyGenerator: (req) => req.authUser.id })
```

It is shared by `/api/tts`, `/api/audio/synthesize`, and `/api/audio/:wordId`.
`app.use("/api/tts", ttsIpLimiter)` (120/min per IP) does **not** apply to the
`/api/audio/*` routes; only the global 200/min limiter does, which is not close
to being a factor at this pace.

At 1 request/second the 31st call in the minute returns **HTTP 429**, so 60/min
is the wrong cadence for this server. Use **one word every 2000 ms (30/min)**:

- **Pace at 2 s per word** (`paceMs = 2000`). That keeps the run under the limit
  instead of bouncing off it. Speed is roughly a wash — 100 words take ~200 s,
  versus ~220 s at 1 s pacing once two forced 60 s cooldowns are counted — but
  2 s never produces a 429, never burns an upstream request on a rejection, and
  cannot accidentally trip the 3-consecutive-failure abort.
- **Keep the 429 branch anyway**, as a safety valve. The limiter counts *every*
  TTS call by that user, including a word the admin clicks to listen to while
  the run is going, and window boundaries drift with network jitter. On 429:
  wait 60 s, retry the same word, do not count it as a failure.
- Only non-429 problems (network, 5xx, no `audioUrl`, RPC rejected) count toward
  the 3-consecutive-failure abort rule.
- Do **not** raise `ttsUserLimiter`. It is the only thing protecting an
  unofficial upstream endpoint from your own egress IP.

Also note the server applies a 10 s request timeout to non-AI routes, so the
client abort must exceed that (use 12 s), and a hung request is always a failure.

### 4.3 There is no per-day audio limit (checked)

The only daily quota in the backend is `AI_USER_DAILY_REQUESTS` (default 300,
`ai-service/app.js:72`), and it is mounted only on `/api/ai/*` and
`/api/admin/ai-usage` (`ai-service/app.js:303` and `:311`). Audio generation
never touches it.

Verified in `spellycraft-server/index.js`: the TTS surface has exactly three
limits — the global 200/min, `ttsIpLimiter` 120/min (mounted on `/api/tts`
only), and `ttsUserLimiter` 30/min. **No daily cap on audio.** Nothing to remove;
leave the AI daily quota alone.

Consequence: the true ceiling for a bulk run is 30 words/minute, not a daily
budget. You can run all day in 100-word batches.

---

## 5. Database migration

**Already created — do not write these again.**

- `database/migrations/20261118_vocabulary_audio_generation.sql`
- `database/migrations/20261118_vocabulary_audio_generation_rollback.sql`

The forward file creates exactly two functions and nothing else. Apply
instructions, the read-side verification query, and the rollback command are in
§3.1.

Contract the frontend depends on:

| Function | Rights | Returns | Guard |
|---|---|---|---|
| `get_vocabulary_audio_counts()` | `SECURITY INVOKER`, `authenticated` | `TABLE(topic TEXT, total BIGINT, generated BIGINT)` — one row per non-uploaded topic | RLS applies to the caller |
| `set_vocabulary_audio_url(p_word TEXT, p_audio_url TEXT)` | `SECURITY DEFINER`, `authenticated` | `INTEGER` rows updated | `is_admin()` → `42501`; 1–100 char word; URL must match `^https://…/storage/v1/object/public/spelling-audio/` |

The update is `lower(word) = lower(p_word) AND target_tab <> 'uploaded' AND
audio_url IS DISTINCT FROM p_audio_url`, so it is case-insensitive, never
touches user uploads, and never rewrites an unchanged row.

Do **not** touch `update_vocabulary_audio` — it exists only in the live database
and the new client flow no longer depends on it.

---

## 6. Files to create / change

| File | Change |
|---|---|
| `src/utils/bulkAudio.js` | **New.** Pure helpers: `buildPendingBatch`, `runBulkAudioBatch`. **Zero imports** so `node --test` can load it. |
| `src/hooks/useBulkAudioGeneration.js` | **New.** Owns Supabase reads, the RPC, the fetch call, React state, toasts, audit log. |
| `src/components/admin/TopicAudioControls.jsx` | **New.** The per-row cell: coverage text, progress, button/stop. |
| `src/pages/VocabMonitorPage.jsx` | **Change.** One extra column + one hook call. Keep the diff small. |
| `tests/bulk_audio.test.js` | **New.** `node --test`, no React, no network. |
| `database/migrations/20261118_vocabulary_audio_generation.sql` | **Already created.** Apply per §3.1. |
| `database/migrations/20261118_vocabulary_audio_generation_rollback.sql` | **Already created.** Rollback per §3.1. |

File-size note: `VocabMonitorPage.jsx` is already 669 lines, above the
`AGENTS.md` §5 guideline. Do not grow it further than the mandatory wiring.

---

## 7. `src/utils/bulkAudio.js` — pure logic, no imports

```js
/**
 * Bulk audio helpers. Deliberately dependency-free: the unit tests import this
 * module in plain Node, where React, Vite's import.meta.env and Supabase do
 * not exist.
 */

/**
 * Collapse a topic's pending rows into unique words and cap the batch.
 * - Two rows in one topic can differ only by letter case ("Analyze"/"analyze").
 *   They share one MP3, so generate it once.
 * - Hard cap of 100 words per run (owner's limit). The rest stays pending and
 *   the next run picks it up automatically, because "pending" is a DB query.
 */
export function buildPendingBatch(rows, limit = 100) {
  const seen = new Set();
  const batch = [];
  for (const row of rows || []) {
    const word = (row?.word || "").trim();
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    batch.push({ word });           // the row id is intentionally dropped
    if (batch.length >= limit) break;
  }
  return batch;
}

/**
 * Sequential generator with the owner's exact stop rules.
 *
 * @param tasks   [{ word }] already deduped + capped
 * @param generate async (task) => ({ audioUrl, cached })       // throws on failure
 * @param persist  async (task, audioUrl) => number             // rows updated
 * @param wait     injectable sleep, for tests
 * @returns {{ status, generated, reused, failed, message }}
 *          status: 'done' | 'stopped' | 'blocked'
 */
export async function runBulkAudioBatch({ ... }) { ... }
```

`runBulkAudioBatch` behaviour, in order, per word:

1. `shouldStop()` → return `status: 'stopped'` immediately (checked **between**
   words only; never abort an in-flight request, it may already have uploaded).
2. If `consecutiveFailures >= maxConsecutiveFailures` (3) → return `'blocked'`.
3. `await wait(paceMs)` with `paceMs = 2000`. Two seconds per word = 30/min,
   exactly the server's per-user TTS limit, so the normal path never returns
   429. Pace is measured per request, so a slow word just runs slower; it never
   bunches requests together.
4. `generate(task)` → on success `persist(task, audioUrl)`:
   - `persist` returning `0` is a **failure** ("the URL was produced but no row
     accepted it"), not a success.
   - `cached === true` → `reused++`, else `generated++`.
   - reset `consecutiveFailures = 0`, advance to the next word.
5. On a thrown `err.rateLimited === true` (HTTP 429):
   - if `cooldownsUsed < 3` → `cooldownsUsed++`, `consecutiveFailures = 0`,
     `await wait(60_000)`, **retry the same word** (do not advance).
   - else fall through to the failure branch (a permanent wall).
6. On any other error → `failed.push(task.word)`, `consecutiveFailures++`,
   advance to the next word.
7. `onProgress({ done, total, generated, reused, failed, message })` after every
   word so the UI can render a live bar.

Return `{ status: 'done', generated, reused, failed, message }` when the batch is
exhausted, and include a human message for `'blocked'`
(`"Stopped after 3 consecutive failures — the speech service looks blocked. Click Generate again later; it resumes where it stopped."`).

Comments must explain **why**, not restate the code: one comment on the 429
branch naming the 30/min limiter, one on the 100-word cap naming resumability,
one on `persist === 0`.

---

## 8. `src/hooks/useBulkAudioGeneration.js`

Imports: `useState`, `useCallback`, `useEffect`, `useRef` from React;
`supabase` from `services/supabaseClient`; `recordAuditLog` from
`services/auditService`; `buildPendingBatch`, `runBulkAudioBatch` from
`utils/bulkAudio`; `showSuccessToast`, `showErrorAlert` from `utils/sweetalert`.

Exposes:

```js
{
  countsByTopic,   // { [topic]: { total, generated } }
  countsLoading,
  refreshCounts,
  run,             // null | { topic, total, done, generated, reused, failed, status, message }
  startRun,        // (topic) => Promise<void>
  stopRun,         // () => void
  isRunning,       // boolean
}
```

### 8.1 `refreshCounts`

```js
const { data, error } = await supabase.rpc("get_vocabulary_audio_counts");
```

Map to `{ [row.topic]: { total: Number(row.total), generated: Number(row.generated) } }`.
Call it once on mount, and again when a run finishes. A failed call must leave
the previous counts in place and never throw into render — the table must still
render with `—` when the migration has not been applied yet.

### 8.2 `startRun(topic)`

1. Bail if another run is active (`runRef.current`).
2. Read the backend base exactly like `src/utils/speechTts.js:145`:
   `import.meta.env.VITE_BACKEND_URL || "https://www.api.spellycraft.com"`.
3. Get the access token: `const { data: { session } } = await supabase.auth.getSession()`.
   No token → `showErrorAlert("Sign in required", ...)` and stop.
4. Fetch the pending rows — this is the only place "what is missing" is decided:

   ```js
   const { data, error } = await supabase
     .from("vocabularies")
     .select("id, word, audio_url")
     .eq("topic", topic)
     .neq("target_tab", "uploaded")   // uploaded words never get server audio
     .is("audio_url", null)
     .order("word", { ascending: true })
     .limit(100);
   ```

5. `buildPendingBatch(data)` → if empty, show an info toast and refresh counts.
6. Build `generate`:

   ```js
   const controller = new AbortController();
   const timer = setTimeout(() => controller.abort(), 12_000); // > server's 10s cap
   const response = await fetch(`${backendBase}/api/audio/synthesize`, {
     method: "POST",
     headers: {
       Authorization: `Bearer ${session.access_token}`,
       "Content-Type": "application/json",
     },
     // word only — see section 4.1: no vocabId, so the file is <word>.mp3
     body: JSON.stringify({ word: task.word, voice: "en-US-ChristopherNeural" }),
     signal: controller.signal,
   });
   ```

   - `response.status === 429` → `throw Object.assign(new Error("rate limited"), { rateLimited: true })`.
   - `!response.ok` → throw with the status.
   - Non-JSON content type → throw `"upload failed"` (that path means the server
     streamed bytes because storage was unreachable, so there is no URL to save).
   - `!json.audioUrl` → throw.
   - Return `{ audioUrl: json.audioUrl, cached: Boolean(json.cached) }`.
   - `finally { clearTimeout(timer); }`.

7. Build `persist`:

   ```js
   const { data: rows, error } = await supabase.rpc("set_vocabulary_audio_url", {
     p_word: task.word,
     p_audio_url: audioUrl,
   });
   if (error) throw error;
   return Number(rows) || 0;
   ```

8. `await runBulkAudioBatch({ tasks, generate, persist, shouldStop: () => stopRef.current, onProgress })`, wiring `onProgress` to `setRun(...)`.
9. On finish:
   - `recordAuditLog({ userId: user?.id, userName: user?.name || "Admin", action: "VOCAB_AUDIO_GENERATED", details: `Audio generation for "${topic}": ${generated} generated, ${reused} reused, ${failed.length} failed of ${total} queued`, timestamp: new Date().toISOString() })` — **one entry per run**, including aborted and blocked runs.
   - `refreshCounts()`, then `fetchStats()` is *not* needed (word counts do not change).
   - Toast: success when `failed.length === 0 && status === 'done'`; otherwise `showErrorAlert` with the failed words (first 5) and the message.

`stopRun()` sets `stopRef.current = true`. Reset it at the start of every run.
The current in-flight word still completes and is persisted.

---

## 9. `src/components/admin/TopicAudioControls.jsx`

Props: `{ topic, stats, run, isRunning, onGenerate, onStop }`.

Renders, inside a table cell (`<td className="py-3.5 px-3">`):

- **Uploaded topic** (`topic.tab === "Uploaded"` or `stats` undefined):
  `<span className="text-xs text-muted-label italic">Browser voice</span>`.
- **Coverage**: `{generated} / {total}` in `font-semibold text-body-dark`, plus a
  thin bar (`h-1.5 rounded-full bg-plum/10` with `bg-plum` width `%`), and
  `aria-label="12 of 40 words have audio"`.
- **This row is running**: `Generating {done} / {total}…`, the same bar, and a
  `Stop` button (`min-h-11`, secondary style, `HiStopCircle`).
- **Idle, missing > 0**: `Generate {missing} missing` button — `imlaa-btn-secondary`,
  `min-h-11`, `HiSpeakerWave`, disabled when `isRunning` (any topic) with
  `disabled:opacity-40 disabled:cursor-not-allowed`.
- **Idle, missing === 0**: disabled button labelled `All audio ready` with
  `HiCheckCircle`, `text-emerald-700 border-emerald-300 bg-emerald-50`.
- **Blocked/failed message**: one line of `text-xs text-rose-700` under the
  button, only for the topic that just ran.

Accessibility: the live counter lives in an element with `aria-live="polite"`,
and every control keeps the 44 px floor (`min-h-11`).

---

## 10. `src/pages/VocabMonitorPage.jsx` wiring

1. `import useBulkAudioGeneration from "../hooks/useBulkAudioGeneration";`
   and `import TopicAudioControls from "../components/admin/TopicAudioControls";`
2. In the component: `const { countsByTopic, run, startRun, stopRun, isRunning, refreshCounts } = useBulkAudioGeneration(user);`
3. Add one `<th className="py-3 px-3">Audio Coverage</th>` before the
   `Delete Card` header and the matching `<td>` before the delete cell in the
   `combinedTopics.map(...)` row.
4. Pass `stats={countsByTopic[topic.title]}`, `isRunning`,
   `onGenerate={() => startRun(topic.title)}`, `onStop={stopRun}`,
   `run={run?.topic === topic.title ? run : null}`.
5. Nothing else changes: deleting topics, pagination, other tabs, and the header
   counts stay exactly as they are. The `overflow-x-auto` wrapper already
   handles the extra column.

---

## 11. Tests — `tests/bulk_audio.test.js`

`node --test` + `node:assert/strict`, importing only `../src/utils/bulkAudio.js`.
Use a fake `generate`/`persist` and an injected `wait` that records durations
instead of sleeping. Required cases:

1. `buildPendingBatch` dedupes `Analyze`/`analyze` into one task.
2. `buildPendingBatch` stops at 100 tasks for a 150-row input.
3. All-success run → `status: 'done'`, `generated` equals task count,
   `failed` empty.
4. Three consecutive rejections → `status: 'blocked'`, `failed.length === 3`,
   and a fourth task never runs.
5. A rejection followed by successes → `status: 'done'`, `failed.length === 1`
   (proves the counter resets).
6. A `{ rateLimited: true }` rejection then success → `status: 'done'`,
   `failed` empty, and the recorded wait sequence contains `60_000`.
7. `persist` returning `0` is counted as a failure.
8. `shouldStop` returning `true` after the first word → `status: 'stopped'` and
   no further `generate` calls.
9. Two successful words with an injected `wait` → the recorded wait sequence is
   `[2000, 2000]`, locking the 30/min cadence so a future edit cannot quietly
   raise it back to 60/min.

Copy the import/assert style from `tests/volunteer_application.test.js`.

---

## 12. Acceptance checks (manual, on localhost)

1. Apply the migration, reload the admin page. Every non-uploaded topic shows
   `x / y`; uploaded topics show `Browser voice`; the table has no horizontal
   overflow at 360 px and every control is ≥ 44 px tall.
2. Pick a topic with missing audio → button reads `Generate N missing`.
3. Start it. Counters climb about one word every **2 seconds** (~30/min, matching
   the server limit) and the run completes without pausing. If the app hits a
   `Rate limited – pausing` message anyway, it waits 60 s and resumes by itself:
   that is the safety valve for other TTS calls made by the same account, not a
   bug.
4. Click **Stop** mid-run. It stops after the current word, the summary toast
   appears, and `vocabularies.audio_url` is filled for exactly the words that
   completed.
5. Click generate again. It starts from the first remaining word — no redoing.
6. Storage: `spelling-audio/<word>.mp3`, one object per word, no
   `<uuid>.mp3` duplicates.
7. If the same word exists in two topics, generating it in topic A also clears
   it in topic B on the next count refresh, and the CDN URL is identical in both
   rows.
8. A topic at 100 % shows the disabled `All audio ready` state; clicking it is a
   no-op.
9. Uploaded topics never call the backend (check the network panel while
   playing an uploaded word).
10. A non-admin account cannot run the RPC
    (`select set_vocabulary_audio_url('test','https://x/storage/v1/object/public/spelling-audio/a.mp3')`
    raises `42501`).
11. The audit log gets exactly one `VOCAB_AUDIO_GENERATED` entry per run.

---

## 13. Verification commands (must all pass before reporting done)

```bash
# spellycraft-web
npm run lint
npm test
npm run security:scan
npm run build

# spellycraft-server (no server code changes, but prove it)
npm run check
npm test
npm run security:scan
```

Also: `public/sitemap.xml` is rewritten by `npm run build`. Exclude it from the
commit; `LandingPage.jsx` already has an unrelated uncommitted nav change that
must not be mixed into this work.

---

## 14. Known limits to record, not fix

- **Throughput ceiling is the server limiter**, not the client: 30 words/min, so
  ~3.3 minutes per 100-word batch. The 100 cap keeps a single click bounded.
  There is no daily audio quota, so repeat runs are fine.
- **`audio_url` has no voice column.** Changing `en-US-ChristopherNeural` later
  will not regenerate anything. If that ever matters, add an `audio_voice`
  column and treat a mismatch as missing — do not special-case it now.
- **Deleted words leave orphan MP3s.** A few KB each; clean up manually later if
  it ever matters.
- **Words with two pronunciations** (`read`, `live`) share one file. Accept.
- **Only the admin's browser runs this.** Closing the tab stops the run; nothing
  is lost, the next click resumes.
