import { useCallback, useEffect, useState } from "react";
import { getAiUsageAnalytics } from "../../services/aiService";

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

export default function AiUsageTab() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      setAnalytics(await getAiUsageAnalytics());
    } catch (error) {
      setErrorMessage(error.message || "AI analytics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const today = analytics?.today || {};
  const providers = Array.isArray(analytics?.providers) ? analytics.providers : [];
  const recentErrors = Array.isArray(analytics?.recentErrors)
    ? analytics.recentErrors
    : [];
  const leadingProvider = providers[0]?.provider || "No usage yet";

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold text-body-dark">AI Usage & Errors</h3>
          <p className="mt-1 text-sm text-muted-label">
            Provider-reported token counts and sanitized generation failure codes.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAnalytics}
          disabled={loading}
          className="imlaa-btn-secondary min-h-11 px-4 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Requests today", formatNumber(today.requestCount)],
          ["Tokens today", formatNumber(today.totalTokens)],
          ["Provider errors today", formatNumber(today.errorCount)],
          ["Most-used provider (30d)", leadingProvider],
        ].map(([label, value]) => (
          <div key={label} className="imlaa-card space-y-2 border border-plum/20 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-label">{label}</p>
            <p className="break-words text-2xl font-black text-body-dark">{value}</p>
          </div>
        ))}
      </div>

      <div className="imlaa-card space-y-4 border border-plum/20 p-5 sm:p-6">
        <h4 className="text-lg font-bold text-body-dark">Provider breakdown — last 30 days</h4>
        {loading && !analytics ? (
          <p className="text-sm text-muted-label">Loading provider usage...</p>
        ) : providers.length === 0 ? (
          <p className="text-sm text-muted-label">No AI provider usage has been recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-plum/15 text-xs uppercase text-muted-label">
                <tr>
                  <th className="py-3 pr-4">Provider</th>
                  <th className="py-3 pr-4">Requests</th>
                  <th className="py-3 pr-4">Tokens</th>
                  <th className="py-3">Errors</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.provider} className="border-b border-plum/10 last:border-0">
                    <td className="py-3 pr-4 font-semibold capitalize text-body-dark">
                      {provider.provider}
                    </td>
                    <td className="py-3 pr-4">{formatNumber(provider.request_count)}</td>
                    <td className="py-3 pr-4">{formatNumber(provider.total_tokens)}</td>
                    <td className="py-3">{formatNumber(provider.error_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="imlaa-card space-y-4 border border-plum/20 p-5 sm:p-6">
        <div>
          <h4 className="text-lg font-bold text-body-dark">Recent provider errors</h4>
          <p className="mt-1 text-sm text-muted-label">
            Error codes only; prompts, generated text, words, and raw console output are not stored.
          </p>
        </div>
        {recentErrors.length === 0 ? (
          <p className="text-sm text-muted-label">No AI generation errors recorded.</p>
        ) : (
          <ul className="divide-y divide-plum/10">
            {recentErrors.map((item) => (
              <li
                key={`${item.request_id}:${item.error_code}:${item.created_at}`}
                className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-semibold text-rose-700">
                  {item.error_code || "UNKNOWN_ERROR"}
                  {item.provider ? ` · ${item.provider}` : ""}
                  {item.model ? ` · ${item.model}` : ""}
                </span>
                <time className="text-muted-label" dateTime={item.created_at}>
                  {formatDate(item.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
