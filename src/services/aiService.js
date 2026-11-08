import { supabase } from "./supabaseClient";
import { invalidateVocabularyCache } from "./queryCache";

function getAiServiceUrl() {
  const configuredUrl = import.meta.env?.VITE_AI_BACKEND_URL?.trim();
  if (!configuredUrl) {
    throw new Error("AI definitions are not configured for this deployment.");
  }
  return configuredUrl.replace(/\/+$/, "");
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("Your session could not be verified. Please sign in again.");
  const token = data?.session?.access_token;
  if (!token) throw new Error("Please sign in again to use AI definitions.");
  return token;
}

async function postAuthenticated(path, body) {
  const [baseUrl, token] = await Promise.all([getAiServiceUrl(), getAccessToken()]);
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const error = new Error(
      ["AI_RATE_LIMIT_EXCEEDED", "AI_DAILY_LIMIT_EXCEEDED", "AI_IP_RATE_LIMIT_EXCEEDED"].includes(
        payload?.error,
      )
        ? "You have reached the definition request limit. Please try again shortly."
        : "AI generation is temporarily unavailable. Please try again later.",
    );
    error.code = payload?.error || "AI_REQUEST_FAILED";
    throw error;
  }
  return payload;
}

export function generateVocabularyMeaning(vocabularyId, languageCode) {
  return postAuthenticated("/api/ai/meaning", { vocabularyId, languageCode })
    .then((result) => {
      invalidateVocabularyCache();
      return result;
    });
}

export function generateVocabularyDefinition(vocabularyId) {
  return postAuthenticated("/api/ai/definition", { vocabularyId })
    .then((result) => {
      invalidateVocabularyCache();
      return result;
    });
}

export async function getAiUsageAnalytics() {
  const baseUrl = getAiServiceUrl();
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl}/api/admin/ai-usage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const error = new Error(
      payload?.error === "ADMIN_ACCESS_REQUIRED"
        ? "Administrator access is required."
        : "AI analytics could not be loaded.",
    );
    error.code = payload?.error || "AI_ANALYTICS_UNAVAILABLE";
    throw error;
  }
  return payload.data;
}

export async function clearAiUsageErrors() {
  const { data, error } = await supabase.rpc("clear_ai_usage_errors");
  if (error) {
    const clearError = new Error(
      error.code === "42501"
        ? "Administrator access is required to clear AI error logs."
        : "AI error logs could not be cleared.",
    );
    clearError.code = error.code || "AI_ERROR_LOG_CLEAR_FAILED";
    throw clearError;
  }
  return Number(data) || 0;
}
