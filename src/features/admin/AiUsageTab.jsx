import { useCallback, useEffect, useState } from "react";
import { HiChevronLeft, HiChevronRight, HiTrash } from "react-icons/hi2";
import {
  clearAiUsageErrors,
  getAiUsageAnalytics,
} from "../../services/aiService";
import {
  showConfirmModal,
  showErrorAlert,
  showSuccessToast,
} from "../../utils/sweetalert";

const ERROR_PAGE_SIZE = 5;

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

function formatProvider(value) {
  return value === "nvidia_nim" ? "NVIDIA NIM" : value;
}

export default function AiUsageTab() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorsPage, setErrorsPage] = useState(0);
  const [clearingErrors, setClearingErrors] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      setAnalytics(await getAiUsageAnalytics());
      return true;
    } catch (error) {
      setErrorMessage(error.message || "AI analytics could not be loaded.");
      return false;
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
  const errorsPageCount = Math.ceil(recentErrors.length / ERROR_PAGE_SIZE);
  const visibleErrors = recentErrors.slice(
    errorsPage * ERROR_PAGE_SIZE,
    (errorsPage + 1) * ERROR_PAGE_SIZE,
  );
  const firstVisibleError = recentErrors.length === 0
    ? 0
    : errorsPage * ERROR_PAGE_SIZE + 1;
  const lastVisibleError = Math.min(
    (errorsPage + 1) * ERROR_PAGE_SIZE,
    recentErrors.length,
  );
  const leadingProvider = providers[0]?.provider || "No usage yet";

  useEffect(() => {
    setErrorsPage((page) => Math.min(page, Math.max(0, errorsPageCount - 1)));
  }, [errorsPageCount]);

  const handleClearErrors = async () => {
    const confirmation = await showConfirmModal({
      title: "Clear AI error logs?",
      text: "This permanently deletes failed provider-attempt log entries. Successful usage records and generated vocabulary are not deleted.",
      confirmButtonText: "Clear error logs",
      cancelButtonText: "Keep logs",
      isDanger: true,
    });
    if (!confirmation.isConfirmed) return;

    setClearingErrors(true);
    try {
      const deletedCount = await clearAiUsageErrors();
      setErrorsPage(0);
      setAnalytics(null);
      showSuccessToast(
        "AI error logs cleared",
        `${formatNumber(deletedCount)} failed log entries deleted.`,
      );
      await loadAnalytics();
    } catch (error) {
      showErrorAlert(
        "Could Not Clear AI Error Logs",
        error.message || "Please try again later.",
      );
    } finally {
      setClearingErrors(false);
    }
  };

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
            <p className="wrap-break-word text-2xl font-black text-body-dark">{value}</p>
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
            <table className="w-full min-w-xl text-left text-sm">
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
                      {formatProvider(provider.provider)}
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
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h4 className="text-lg font-bold text-body-dark">Recent provider errors</h4>
            <p className="mt-1 text-sm text-muted-label">
              Error codes only; prompts, generated text, words, and raw console output are not stored.
              {" "}HTTP 400 usually indicates an unsupported request, 401/403 a key or access issue,
              and 404 a model or endpoint mismatch.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearErrors}
            disabled={loading || clearingErrors || recentErrors.length === 0}
            className="imlaa-btn-secondary inline-flex min-h-11 shrink-0 items-center justify-center gap-2 px-4 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiTrash className="h-4 w-4" aria-hidden="true" />
            {clearingErrors ? "Clearing..." : "Clear error logs"}
          </button>
        </div>
        {loading && !analytics ? (
          <p className="text-sm text-muted-label">Loading recent provider errors...</p>
        ) : recentErrors.length === 0 ? (
          <p className="text-sm text-muted-label">No AI generation errors recorded.</p>
        ) : (
          <>
            <ul className="divide-y divide-plum/10" aria-live="polite">
              {visibleErrors.map((item, index) => (
                <li
                  key={`${item.request_id}:${item.error_code}:${item.created_at}:${item.provider}:${item.model}:${errorsPage}:${index}`}
                  className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-semibold text-rose-700">
                    {[
                      item.error_code || "UNKNOWN_ERROR",
                      item.provider ? formatProvider(item.provider) : null,
                      item.model,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <time className="text-muted-label" dateTime={item.created_at}>
                    {formatDate(item.created_at)}
                  </time>
                </li>
              ))}
            </ul>
            {recentErrors.length > ERROR_PAGE_SIZE && (
              <div className="flex flex-col gap-3 border-t border-plum/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-label" aria-live="polite">
                  Showing {firstVisibleError}–{lastVisibleError} of {formatNumber(recentErrors.length)} errors
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Show previous errors"
                    onClick={() => setErrorsPage((page) => Math.max(0, page - 1))}
                    disabled={errorsPage === 0}
                    className="imlaa-btn-secondary inline-flex min-h-11 min-w-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <HiChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <span className="min-w-16 text-center text-sm font-semibold text-body-dark">
                    {errorsPage + 1} / {errorsPageCount}
                  </span>
                  <button
                    type="button"
                    aria-label="Show next errors"
                    onClick={() =>
                      setErrorsPage((page) => Math.min(errorsPageCount - 1, page + 1))
                    }
                    disabled={errorsPage >= errorsPageCount - 1}
                    className="imlaa-btn-secondary inline-flex min-h-11 min-w-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <HiChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
