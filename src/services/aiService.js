import { supabase } from "./supabaseClient";
import { invalidateVocabularyCache } from "./queryCache";

const GENERATION_TIMEOUT_MS = 45_000;
const ANALYTICS_TIMEOUT_MS = 15_000;

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

async function fetchWithTimeout(url, options, timeoutMs, operation) {
  try {
    return await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new Error(
        `${operation} timed out after ${Math.round(timeoutMs / 1000)} seconds. Check that the Render backend is reachable, then try again.`,
        { cause: error },
      );
    }
    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect to the AI backend. Check VITE_AI_BACKEND_URL, Render availability, and allowed CORS origins.",
        { cause: error },
      );
    }
    throw error;
  }
}

async function postAuthenticated(path, body) {
  const [baseUrl, token] = await Promise.all([getAiServiceUrl(), getAccessToken()]);
  const response = await fetchWithTimeout(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }, GENERATION_TIMEOUT_MS, "AI generation");
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
  const response = await fetchWithTimeout(`${baseUrl}/api/admin/ai-usage`, {
    headers: { Authorization: `Bearer ${token}` },
  }, ANALYTICS_TIMEOUT_MS, "AI analytics request");
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const error = new Error(
      payload?.error === "ADMIN_ACCESS_REQUIRED"
        ? "Administrator access is required."
        : "AI analytics could not be loaded.",
    );
    error.code = payload?.error || "AI_ANALYTICS_UNAVAILABLE";
    error.status = response.status;
    throw error;
  }
  const data = payload.data;
  if (
    !data ||
    typeof data !== "object" ||
    !data.today ||
    !Array.isArray(data.providers) ||
    !Array.isArray(data.recentErrors)
  ) {
    const error = new Error(
      "The AI backend returned incomplete analytics. Confirm the AI database migration is applied and the backend is up to date.",
    );
    error.code = "AI_ANALYTICS_RESPONSE_INVALID";
    throw error;
  }
  return data;
}

export async function clearAiUsageErrors() {
  const { data, error } = await supabase
    .rpc("clear_ai_usage_errors")
    .abortSignal(AbortSignal.timeout(ANALYTICS_TIMEOUT_MS));
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
