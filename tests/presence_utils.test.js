import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregatePresence,
  formatRelativeTime,
  formatSessionDuration,
  getRouteLabel,
} from "../src/utils/presenceUtils.js";

test("route labels map workspace paths to short names", () => {
  assert.equal(getRouteLabel("/workspace/flashcards"), "Flashcards");
  assert.equal(getRouteLabel("/workspace/grammar/lesson/5"), "Grammar Lesson");
  assert.equal(getRouteLabel("/workspace/admin/"), "Admin Dashboard");
  assert.equal(getRouteLabel("/workspace/unknown-page?tab=1"), "Workspace");
  assert.equal(getRouteLabel("/"), "Landing");
  assert.equal(getRouteLabel(undefined), "Landing");
});

test("session durations collapse into compact hour/minute/second forms", () => {
  assert.equal(formatSessionDuration(0), "<1m");
  assert.equal(formatSessionDuration(59), "<1m");
  assert.equal(formatSessionDuration(260), "4m 20s");
  assert.equal(formatSessionDuration(3600 + 4 * 60), "1h 04m");
  assert.equal(formatSessionDuration(-10), "<1m");
});

test("relative activity timestamps report just now, minutes, hours, and days", () => {
  const now = new Date("2026-01-01T12:00:00.000Z").getTime();
  const ago = (seconds) =>
    new Date(now - seconds * 1000).toISOString();

  assert.equal(formatRelativeTime(ago(5), now), "just now");
  assert.equal(formatRelativeTime(ago(42), now), "42s ago");
  assert.equal(formatRelativeTime(ago(3 * 60), now), "3m ago");
  assert.equal(formatRelativeTime(ago(2 * 3600 + 5 * 60), now), "2h 5m ago");
  assert.equal(formatRelativeTime(ago(3 * 86400), now), "3d ago");
  assert.equal(formatRelativeTime("not-a-date", now), "unknown");
});

test("aggregatePresence collapses multiple tabs into one row per user", () => {
  const now = new Date("2026-01-01T12:10:00.000Z").getTime();
  const presenceState = {
    "user-1": [
      {
        user_id: "user-1",
        name: "Amina",
        role: "general",
        route: "/workspace/spelling",
        joined_at: "2026-01-01T12:00:00.000Z",
        last_active_at: "2026-01-01T12:05:00.000Z",
      },
      {
        user_id: "user-1",
        name: "Amina",
        role: "general",
        route: "/workspace/flashcards",
        joined_at: "2026-01-01T11:58:00.000Z",
        last_active_at: "2026-01-01T12:09:00.000Z",
      },
    ],
    "user-2": [
      {
        user_id: "user-2",
        name: "Rafiq",
        role: "admin",
        route: "/workspace/admin",
        joined_at: "2026-01-01T12:08:00.000Z",
        last_active_at: "2026-01-01T12:08:30.000Z",
      },
    ],
    "user-3": [{ user_id: "   " }],
  };

  const rows = aggregatePresence(presenceState, now);

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => row.userId),
    ["user-1", "user-2"],
  );

  const amina = rows[0];
  assert.equal(amina.connectionCount, 2);
  assert.equal(amina.name, "Amina");
  assert.equal(amina.route, "/workspace/flashcards");
  assert.equal(amina.routeLabel, "Flashcards");
  assert.equal(amina.sessionSeconds, 12 * 60);
  assert.equal(amina.lastActiveAt, "2026-01-01T12:09:00.000Z");

  assert.equal(rows[1].role, "admin");
  assert.equal(rows[1].routeLabel, "Admin Dashboard");
});

test("aggregatePresence tolerates missing or malformed state", () => {
  assert.deepEqual(aggregatePresence(null), []);
  assert.deepEqual(aggregatePresence({ key: null }), []);
  assert.deepEqual(aggregatePresence({ key: [{ name: "no id" }] }), []);
});
