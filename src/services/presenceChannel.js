/**
 * Presence channel owner (src/services/presenceChannel.js)
 * Module-level singleton owning the shared Supabase Realtime presence channel.
 *
 * Why this exists: supabase.channel() dedupes channels by topic on one
 * client, and Realtime forbids adding presence callbacks after subscribe().
 * Two independent hooks (tracker + admin roster) each opening panels made
 * StrictMode's double-mounted effects throw
 * "cannot add presence callbacks after subscribe()". Here every handler is
 * attached before subscribe() and the channel is reused for the session, so
 * the tracker and the admin roster always share one safe instance.
 *
 * Security note: with default Supabase Realtime configuration the channel is
 * reachable by anyone with the anon key, so the admin roster (name, role,
 * route) is visible to any client that joins it. To close that gap, enable
 * Realtime Authorization and mark the channel `private: true` with an RLS
 * policy on realtime.messages restricting the roster to admins. That is a
 * dashboard/RLS change and must be reviewed before deploying.
 */
import { supabase } from "./supabaseClient";
import { PRESENCE_CHANNEL_NAME } from "../utils/presenceUtils";

/** @type {{ channel: object, status: string, presenceState: object, joinedAt: string, userId: string|null, pendingPayload: object|null } | null} */
let shared = null;
const uiListeners = new Set();

function emit() {
  if (!shared) return;
  for (const listener of uiListeners) {
    listener({ status: shared.status, presenceState: shared.presenceState });
  }
}

/**
 * Returns the shared channel, creating it on first use. Presence handlers are
 * registered before subscribe() (required) and only once per channel.
 * The channel is intentionally reused across account switches on the same
 * client: removeChannel() tears the channel down asynchronously, so an
 * immediate delete + recreate could re-register presence handlers on the
 * stale channel and throw "cannot add presence callbacks after subscribe()".
 * The roster dedupes by payload user_id, so a re-track with the new account
 * replaces the old entry.
 */
export function ensurePresenceChannel(userId) {
  const id = userId || null;

  if (shared) return shared;

  const channel = supabase.channel(PRESENCE_CHANNEL_NAME, {
    config: id ? { presence: { key: id } } : { presence: {} },
  });
  const state = {
    channel,
    status: "connecting",
    presenceState: {},
    joinedAt: new Date().toISOString(),
    userId: id,
    pendingPayload: null,
  };

  // Sync handler must be registered before subscribe(). It rebuilds the
  // in-memory roster on every join/leave/sync event.
  const sync = () => {
    state.presenceState = channel.presenceState();
    emit();
  };

  channel
    .on("presence", { event: "sync" }, sync)
    .on("presence", { event: "join" }, sync)
    .on("presence", { event: "leave" }, sync);

  channel.subscribe((status) => {
    state.status = status;
    if (status === "SUBSCRIBED") {
      sync();
      // Deliver a track that raced the subscribe handshake.
      const pending = state.pendingPayload;
      if (pending) {
        state.pendingPayload = null;
        channel.track(pending).catch(() => {});
      }
    } else {
      emit();
    }
  });

  shared = state;
  return state;
}

/**
 * Publishes (or re-publishes) this client's presence payload. If the channel
 * has not finished subscribing yet, the payload is queued and flushed on
 * SUBSCRIBED so the first heartbeat is never lost.
 */
export function trackOnPresenceChannel(payload) {
  if (!shared || !payload?.user_id) return Promise.resolve("NO_CHANNEL");
  if (shared.status !== "SUBSCRIBED") {
    shared.pendingPayload = payload;
    return Promise.resolve("PENDING");
  }
  return shared.channel
    .track(payload)
    .then(() => "TRACKED")
    .catch(() => "DROPPED");
}

/**
 * Registers a UI listener for roster updates. The channel is ensured to exist
 * first (with the caller's presence key where provided) so consumers always
 * share one live connection. Returns an unsubscribe function that removes only
 * the listener — the channel stays open for the session.
 */
export function subscribeToPresence(userId, listener) {
  ensurePresenceChannel(userId);
  uiListeners.add(listener);
  // Catch the new listener up with the current state instead of waiting for
  // the next sync event.
  listener({ status: shared.status, presenceState: shared.presenceState });

  return () => {
    uiListeners.delete(listener);
  };
}
