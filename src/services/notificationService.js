/**
 * Admin notification service (src/services/notificationService.js)
 * Reads the admin-only notification feed written by database triggers for
 * volunteer applications, registrations, community tickets, and developer
 * applications. Read state is stored in the database so it survives reloads.
 */
import { supabase } from "./supabaseClient";
import { toCamel } from "./dataMappers";

const TABLE = "admin_notifications";

function mapNotificationError(error) {
  const code = error?.code;
  const message = String(error?.message || "");

  if (
    code === "42P01" ||
    code === "PGRST205" ||
    message.toLowerCase().includes("could not find the table")
  ) {
    return "The notification center is not provisioned yet. Apply database migration 20261116_volunteer_program.sql first.";
  }
  if (code === "42501") {
    return "Administrator access is required to read notifications.";
  }
  return message || "Notifications could not be loaded.";
}

export async function listAdminNotifications({ limit = 40 } = {}) {
  const [listResult, unreadResult, volunteerUnreadResult] = await Promise.all([
    supabase
      .from(TABLE)
      .select("id, category, title, body, link_tab, source_table, source_id, created_at, read_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
    supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("category", "volunteer")
      .is("read_at", null),
  ]);

  const error = listResult.error || unreadResult.error || volunteerUnreadResult.error;
  if (error) throw new Error(mapNotificationError(error));

  return {
    items: toCamel(listResult.data || []),
    unreadCount: unreadResult.count || 0,
    volunteerUnreadCount: volunteerUnreadResult.count || 0,
  };
}

export async function markAdminNotificationRead(id) {
  const { error } = await supabase
    .from(TABLE)
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  if (error) throw new Error(mapNotificationError(error));
}

export async function markAllAdminNotificationsRead() {
  const { error } = await supabase
    .from(TABLE)
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) throw new Error(mapNotificationError(error));
}
