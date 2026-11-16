/**
 * Admin notification feed hook (src/hooks/useAdminNotifications.js)
 * Polls the database-backed notification feed while the admin dashboard is
 * mounted and exposes optimistic read-state updates for the bell.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../services/notificationService";

const EMPTY_STATE = {
  items: [],
  unreadCount: 0,
  volunteerUnreadCount: 0,
};

export function useAdminNotifications({ pollMs = 45_000 } = {}) {
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const next = await listAdminNotifications();
      if (mountedRef.current) setState(next);
    } catch (loadError) {
      if (mountedRef.current) {
        setError(loadError.message || "Notifications could not be loaded.");
      }
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const interval = setInterval(() => refresh({ silent: true }), pollMs);
    const handleFocus = () => refresh({ silent: true });
    window.addEventListener("focus", handleFocus);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh, pollMs]);

  const markRead = useCallback(
    async (notification) => {
      if (!notification?.id || notification.readAt) return;
      const readAt = new Date().toISOString();

      setState((current) => ({
        items: current.items.map((item) =>
          item.id === notification.id ? { ...item, readAt } : item,
        ),
        unreadCount: Math.max(0, current.unreadCount - 1),
        volunteerUnreadCount:
          notification.category === "volunteer"
            ? Math.max(0, current.volunteerUnreadCount - 1)
            : current.volunteerUnreadCount,
      }));

      try {
        await markAdminNotificationRead(notification.id);
      } catch (markError) {
        setError(markError.message || "The notification could not be updated.");
        refresh({ silent: true });
      }
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    setState((current) => ({
      items: current.items.map((item) => ({ ...item, readAt: item.readAt || readAt })),
      unreadCount: 0,
      volunteerUnreadCount: 0,
    }));

    try {
      await markAllAdminNotificationsRead();
    } catch (markError) {
      setError(markError.message || "Notifications could not be updated.");
      refresh({ silent: true });
    }
  }, [refresh]);

  return {
    ...state,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  };
}
