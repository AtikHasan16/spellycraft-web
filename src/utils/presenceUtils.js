/**
 * Presence utilities (src/utils/presenceUtils.js)
 * Pure, side-effect-free helpers shared by the presence tracker and the
 * "Currently Active" admin tab. Keeping them pure makes them unit-testable
 * without a live Supabase Realtime connection.
 */

export const PRESENCE_CHANNEL_NAME = "spellycraft:active-users";
export const PRESENCE_HEARTBEAT_MS = 60_000;

const ROUTE_LABELS = [
  [/^\/workspace\/dashboard/, "Dashboard"],
  [/^\/workspace\/flashcards/, "Flashcards"],
  [/^\/workspace\/spelling/, "Spelling"],
  [/^\/workspace\/grammar\/lesson\//, "Grammar Lesson"],
  [/^\/workspace\/grammar/, "Grammar"],
  [/^\/workspace\/vocabulary/, "Vocabulary"],
  [/^\/workspace\/profile/, "Profile"],
  [/^\/workspace\/resources/, "Resources"],
  [/^\/workspace\/admin/, "Admin Dashboard"],
  [/^\/workspace\/community/, "Community"],
  [/^\/workspace\/developer/, "Developer Workspace"],
  [/^\/workspace\/contribute/, "Contribute"],
  [/^\/workspace/, "Workspace"],
  [/^\//, "Landing"],
];

/** Convert a route path into a short human label for the admin table. */
export function getRouteLabel(pathname) {
  const cleanPath = String(pathname || "/").split("?")[0];
  for (const [pattern, label] of ROUTE_LABELS) {
    if (pattern.test(cleanPath)) return label;
  }
  return cleanPath;
}

/** Format a session length (seconds) as `1h 04m`, `4m 20s`, or `<1m`. */
export function formatSessionDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  if (total < 60) return "<1m";

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

/** Format a past timestamp as a compact relative time (`just now`, `3m ago`). */
export function formatRelativeTime(timestamp, now = Date.now()) {
  const parsed = new Date(timestamp).getTime();
  if (!Number.isFinite(parsed)) return "unknown";

  const diffSeconds = Math.max(0, Math.floor((now - parsed) / 1000));
  if (diffSeconds < 10) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Collapse Supabase presence state into one row per user.
 *
 * `presenceState()` looks like:
 *   { "<key>": [ { user_id, name, route, ... }, ... ] }
 * A user may have several tabs/devices, so we keep the most recent activity
 * and expose a connection count instead of rendering duplicate rows.
 */
export function aggregatePresence(presenceState, now = Date.now()) {
  const byUser = new Map();

  for (const metas of Object.values(presenceState || {})) {
    for (const meta of Array.isArray(metas) ? metas : []) {
      const userId = String(meta?.user_id || "").trim();
      if (!userId) continue;

      const lastActiveMs = Math.max(
        0,
        new Date(meta?.last_active_at || 0).getTime() || 0,
      );
      const joinedMs = Math.max(
        0,
        new Date(meta?.joined_at || 0).getTime() || lastActiveMs,
      );

      const existing = byUser.get(userId);
      if (existing) {
        existing.connectionCount += 1;
        if (lastActiveMs > existing.lastActiveMs) {
          existing.lastActiveMs = lastActiveMs;
          existing.lastActiveAt = meta.last_active_at;
          existing.route = meta.route || existing.route;
          // Keep the label in sync; it was derived when the row was created.
          existing.routeLabel = getRouteLabel(existing.route);
        }
        existing.joinedMs = Math.min(existing.joinedMs, joinedMs);
        // The session began at the earliest known tab, so recompute the clock.
        existing.sessionSeconds = Math.max(
          0,
          Math.floor((now - existing.joinedMs) / 1000),
        );
        continue;
      }

      byUser.set(userId, {
        userId,
        name: String(meta?.name || "Unnamed candidate"),
        role: meta?.role === "admin" ? "admin" : "general",
        route: meta?.route || "/",
        routeLabel: getRouteLabel(meta?.route),
        joinedMs,
        lastActiveMs,
        lastActiveAt: meta?.last_active_at || null,
        sessionSeconds: Math.max(0, Math.floor((now - joinedMs) / 1000)),
        connectionCount: 1,
      });
    }
  }

  return [...byUser.values()].sort((a, b) => b.lastActiveMs - a.lastActiveMs);
}
