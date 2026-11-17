/**
 * Volunteer service (src/services/volunteerService.js)
 * Public form submissions and admin-side reads/status updates go directly to
 * Supabase PostgREST under RLS. Anonymous visitors may INSERT only; only
 * administrators may list or update applications.
 */
import { supabase } from "./supabaseClient";
import { toCamel } from "./dataMappers";
import {
  normalizeGmail,
  normalizeWhatsAppNumber,
  validateVolunteerApplication,
} from "../utils/volunteerApplication";

const TABLE = "volunteer_applications";

function requireUuid(value, label = "record") {
  const id = String(value || "").trim();
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)) {
    throw new Error(`A valid ${label} id is required.`);
  }
  return id;
}

function mapVolunteerError(error) {
  const code = error?.code;
  const message = String(error?.message || "");

  if (code === "23505" || message.toLowerCase().includes("submitted recently")) {
    return "An application from this Gmail address was submitted recently. Please wait a few minutes before trying again.";
  }
  if (
    code === "42P01" ||
    code === "PGRST205" ||
    message.toLowerCase().includes("could not find the table")
  ) {
    return "Volunteer applications are not available yet. Apply database migration 20261116_volunteer_program.sql first.";
  }
  if (code === "42501") {
    return "This action is not permitted. Sign in with an administrator account.";
  }
  return message || "The volunteer application could not be completed.";
}

export async function submitVolunteerApplication(draft = {}) {
  const errors = validateVolunteerApplication(draft);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors)[0]);
  }

  const message = String(draft.message || "").trim();
  if (message.length < 20) {
    throw new Error("The application message is too short.");
  }
  if (message.length > 8000) {
    throw new Error("The application message must be 8,000 characters or fewer.");
  }

  const payload = {
    full_name: String(draft.fullName || "").trim(),
    designation: String(draft.designation || "").trim(),
    gmail: normalizeGmail(draft.gmail),
    whatsapp: normalizeWhatsAppNumber(draft.whatsapp),
    country: String(draft.country || "").trim(),
    track: draft.track,
    experience: String(draft.experience || "").trim(),
    message,
  };

  const { error } = await supabase.from(TABLE).insert(payload);

  // No returning representation here: public submitters intentionally have no
  // SELECT policy, so requesting the inserted row would be rejected by RLS.
  if (error) throw new Error(mapVolunteerError(error));
  return { success: true };
}

export async function listVolunteerApplications({ status = "all" } = {}) {
  let query = supabase
    .from(TABLE)
    .select(
      "id, full_name, designation, gmail, whatsapp, country, track, experience, message, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(mapVolunteerError(error));
  return toCamel(data || []);
}

export async function countNewVolunteerApplications() {
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  if (error) throw new Error(mapVolunteerError(error));
  return count || 0;
}

export async function updateVolunteerApplicationStatus(id, status) {
  const applicationId = requireUuid(id, "volunteer application");
  if (!["new", "reviewed", "contacted"].includes(status)) {
    throw new Error("Choose a valid volunteer application status.");
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq("id", applicationId)
    .select("id, status")
    .single();

  if (error) throw new Error(mapVolunteerError(error));
  return toCamel(data);
}
