import { useEffect, useMemo, useState } from "react";
import { subscribeToPresence } from "../services/presenceChannel";
import { useAuth } from "../context/AuthContext";
import { aggregatePresence } from "../utils/presenceUtils";

/**
 * Subscribes an admin to the shared presence channel and returns a live,
 * de-duplicated roster. Backed by the module-level channel owned by
 * presenceChannel.js, so StrictMode's double-mounted effects never attach
 * presence handlers after subscribe().
 */
export function useActiveUsers() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState({
    status: "connecting",
    presenceState: {},
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const unsubscribe = subscribeToPresence(user?.id || null, setSnapshot);
    return unsubscribe;
  }, [user?.id]);

  // Refresh relative timestamps and session clocks every 15s without
  // waiting for a presence event.
  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(ticker);
  }, []);

  const users = useMemo(
    () => aggregatePresence(snapshot.presenceState, now),
    [snapshot.presenceState, now],
  );

  const isLive = snapshot.status === "SUBSCRIBED";

  return {
    users,
    status: snapshot.status,
    isLive,
    now,
  };
}
