import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  ensurePresenceChannel,
  trackOnPresenceChannel,
} from "../services/presenceChannel";
import { PRESENCE_HEARTBEAT_MS } from "../utils/presenceUtils";

/**
 * Publishes the signed-in user's presence to the shared Realtime channel.
 * Mounted once inside WorkspaceLayout so every authenticated route reports a
 * live "currently active" entry. The channel itself is owned by
 * presenceChannel.js and reused for the whole session.
 */
export function usePresenceTracking() {
  const { user, role } = useAuth();
  const { pathname } = useLocation();

  const presenceRef = useRef(null);

  // latestRef mirrors the most recent identity/route for payloads built after
  // render. It is only written inside effects (never during render).
  const latestRef = useRef({
    name: user?.name,
    role: role || user?.role,
    pathname,
  });

  useEffect(() => {
    latestRef.current = {
      name: user?.name,
      role: role || user?.role,
      pathname,
    };
  }, [user?.name, role, user?.role, pathname]);

  const buildPayload = (route) => {
    const latest = latestRef.current;
    return {
      user_id: user?.id,
      name: latest.name || "Unnamed candidate",
      role: latest.role === "admin" ? "admin" : "general",
      route,
      joined_at: presenceRef.current?.joinedAt || new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };
  };

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return undefined;

    // Ensures the shared channel exists (creating it with this user's presence
    // key) and captures the session join time for the roster.
    const presence = ensurePresenceChannel(userId);
    presenceRef.current = presence;

    const track = (route = latestRef.current.pathname) => {
      trackOnPresenceChannel(buildPayload(route)).catch(() => {
        // Presence is best-effort telemetry; a network blip should never
        // interrupt the learner's route.
      });
    };

    track();

    // Heartbeat keeps "last active" fresh while a user reads without
    // navigating.
    const heartbeat = setInterval(() => track(), PRESENCE_HEARTBEAT_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") track();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Intentionally no channel removal here: the channel is shared with the
    // admin roster and survives StrictMode's unmount → remount cycle.
    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      presenceRef.current = null;
    };
    // buildPayload is stable enough for this hook's lifetime; joining is keyed
    // exclusively by the account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Re-publish immediately when the route changes (no channel re-subscribe).
  useEffect(() => {
    if (!user?.id) return;
    trackOnPresenceChannel(buildPayload(pathname)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user?.id]);
}
