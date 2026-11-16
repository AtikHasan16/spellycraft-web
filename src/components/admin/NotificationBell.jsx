/**
 * Admin notification bell (src/components/admin/NotificationBell.jsx)
 * Header bell + dropdown feed backed by the admin_notifications table. The
 * feed is populated by database triggers and polled while the dashboard is
 * open, so no Realtime publication changes are required.
 */
import { useEffect, useRef, useState } from "react";
import {
  HiArrowPath,
  HiBell,
  HiBugAnt,
  HiCheck,
  HiCodeBracket,
  HiHandRaised,
  HiInbox,
  HiLightBulb,
  HiUserPlus,
} from "react-icons/hi2";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";
import { formatRelativeTime } from "../../utils/presenceUtils";

const CATEGORY_META = {
  volunteer: {
    label: "Volunteer",
    icon: HiHandRaised,
    iconClass: "bg-rose-100 text-rose-700",
  },
  registration: {
    label: "Registration",
    icon: HiUserPlus,
    iconClass: "bg-sky-100 text-sky-700",
  },
  community: {
    label: "Community",
    icon: HiCodeBracket,
    iconClass: "bg-violet-100 text-violet-700",
  },
  feature: {
    label: "Feature idea",
    icon: HiLightBulb,
    iconClass: "bg-amber-100 text-amber-800",
  },
  bug: {
    label: "Bug report",
    icon: HiBugAnt,
    iconClass: "bg-orange-100 text-orange-800",
  },
};

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const {
    items,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  } = useAdminNotifications();

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (notification) => {
    markRead(notification);
    setOpen(false);
    onNavigate?.(notification.linkTab || "overview");
  };

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Admin notifications, ${unreadCount} unread`
            : "Admin notifications"
        }
        className="imlaa-btn-secondary relative min-h-11 space-x-1.5 px-2 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-base"
      >
        <HiBell className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Admin notification feed"
          className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-plum/20 bg-white shadow-xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-plum/10 px-4 py-3">
            <div>
              <h3 className="text-sm font-black text-body-dark">
                Notification center
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-label">
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "You are all caught up."}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => refresh()}
                aria-label="Refresh notifications"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-plum transition hover:bg-plum/10"
              >
                <HiArrowPath
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-plum transition hover:bg-plum/10"
                >
                  <HiCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-relaxed text-rose-800"
            >
              {error}
            </p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p role="status" className="px-4 py-8 text-center text-sm text-muted-label">
                Loading notifications…
              </p>
            ) : items.length === 0 && !error ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <HiInbox className="h-7 w-7 text-plum" aria-hidden="true" />
                <p className="text-sm font-semibold text-body-dark">
                  No notifications yet.
                </p>
                <p className="max-w-56 text-[11px] text-muted-label">
                  New volunteer applications, registrations, and community
                  requests will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-plum/10">
                {items.map((notification) => {
                  const meta =
                    CATEGORY_META[notification.category] ||
                    CATEGORY_META.community;
                  const Icon = meta.icon;
                  const unread = !notification.readAt;
                  return (
                    <li
                      key={notification.id}
                      className={`flex items-start gap-1 pr-2 ${
                        unread ? "bg-rose-50/40" : "bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(notification)}
                        className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition hover:bg-plum/5"
                      >
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-body-dark">
                              {notification.title}
                            </span>
                            {unread && (
                              <span
                                className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500"
                                aria-label="Unread"
                              />
                            )}
                          </span>
                          {notification.body && (
                            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-label">
                              {notification.body}
                            </span>
                          )}
                          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-plum">
                            {meta.label} ·{" "}
                            {formatRelativeTime(notification.createdAt, Date.now())}
                          </span>
                        </span>
                      </button>
                      {unread && (
                        <button
                          type="button"
                          onClick={() => markRead(notification)}
                          aria-label={`Mark ${notification.title} as read`}
                          title="Mark as read"
                          className="mt-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-plum transition hover:bg-plum/10"
                        >
                          <HiCheck className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="border-t border-plum/10 bg-plum/5 px-4 py-2 text-[10px] text-muted-label">
            Updates automatically while the dashboard is open. Click an item to
            open the related tab.
          </p>
        </div>
      )}
    </div>
  );
}
