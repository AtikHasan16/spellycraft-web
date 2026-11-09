import { supabase } from "./supabaseClient";
import { parseGoogleDriveLink } from "../utils/googleDriveLinks";

const TABLES = Object.freeze({
  public: "public_resources",
  private: "private_resources",
});

export const RESOURCE_CATEGORIES = Object.freeze([
  "Spelling",
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Vocabulary",
  "Grammar",
  "Pronunciation",
  "Exam Strategy",
  "Other",
]);

function getTable(visibility) {
  const table = TABLES[visibility];
  if (!table) throw new Error("Choose public or private resource visibility.");
  return table;
}

export async function listResources({
  visibility,
  category = "all",
  page = 1,
  pageSize = 9,
} = {}) {
  const table = getTable(visibility);
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("Resource page must be a positive whole number.");
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("Resource page size must be between 1 and 100.");
  }

  const from = (page - 1) * pageSize;
  let query = supabase
    .from(table)
    .select("id, title, category, short_description, drive_url, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (category !== "all") query = query.eq("category", category);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

export async function createResource({
  visibility,
  title,
  category,
  shortDescription,
  driveUrl,
}) {
  const table = getTable(visibility);
  const cleanTitle = String(title || "").trim();
  const cleanDescription = String(shortDescription || "").trim();
  const parsedLink = parseGoogleDriveLink(driveUrl);

  if (!cleanTitle || cleanTitle.length > 140) {
    throw new Error("Resource title is required and must be 140 characters or fewer.");
  }
  if (!RESOURCE_CATEGORIES.includes(category)) {
    throw new Error("Choose a valid resource category.");
  }
  if (!cleanDescription || cleanDescription.length > 600) {
    throw new Error(
      "A short description is required and must be 600 characters or fewer.",
    );
  }
  if (!parsedLink) {
    throw new Error("Enter a valid HTTPS Google Drive or Google Docs sharing link.");
  }

  const { data, error } = await supabase
    .from(table)
    .insert({
      title: cleanTitle,
      category,
      short_description: cleanDescription,
      drive_url: parsedLink.href,
    })
    .select("id, title, category, short_description, drive_url, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResource({ visibility, id }) {
  const table = getTable(visibility);
  if (!id) throw new Error("A resource ID is required.");

  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
