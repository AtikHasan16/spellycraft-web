export const COMMUNITY_CATEGORIES = Object.freeze([
  "General",
  "Spelling",
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Vocabulary",
  "Grammar",
  "Accessibility",
  "Other",
]);

export function validateTicketDraft(draft) {
  const errors = {};
  const title = String(draft.title || "").trim();
  const description = String(draft.description || "").trim();

  if (title.length < 4 || title.length > 140) {
    errors.title = "Title must be between 4 and 140 characters.";
  }
  if (description.length < 10 || description.length > 4000) {
    errors.description = "Description must be between 10 and 4,000 characters.";
  }
  if (!["feature", "bug"].includes(draft.requestType)) {
    errors.requestType = "Choose a feature suggestion or bug report.";
  }
  if (!COMMUNITY_CATEGORIES.includes(draft.category)) {
    errors.category = "Choose a valid category.";
  }

  if (draft.requestType === "bug") {
    for (const [field, label] of [
      ["stepsToReproduce", "Steps to reproduce"],
      ["expectedBehavior", "Expected behavior"],
      ["actualBehavior", "Actual behavior"],
    ]) {
      const value = String(draft[field] || "").trim();
      if (!value || value.length > (field === "stepsToReproduce" ? 3000 : 1500)) {
        errors[field] = `${label} is required and must be within the character limit.`;
      }
    }
  }

  if (draft.relatedUrl) {
    try {
      const url = new URL(draft.relatedUrl);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid URL");
    } catch {
      errors.relatedUrl = "Enter a valid http or https URL.";
    }
  }
  if (draft.allowPublicCredit && !String(draft.publicDisplayName || "").trim()) {
    errors.publicDisplayName = "Enter the name you consent to display publicly.";
  }

  return errors;
}

export function isValidHttpsUrl(value, hostname) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (hostname && url.hostname.toLowerCase() !== hostname.toLowerCase()) return false;
    return true;
  } catch {
    return false;
  }
}
