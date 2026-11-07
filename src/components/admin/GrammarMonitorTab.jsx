import { useCallback, useEffect, useMemo, useState } from "react";
import { HiAcademicCap, HiArrowPath, HiClock, HiMagnifyingGlass, HiTrash } from "react-icons/hi2";
import apiClient from "../../services/apiClient";
import { GRAMMAR_TOPICS } from "../../data/grammarTopics";
import {
  showConfirmModal,
  showErrorAlert,
  showSuccessToast,
} from "../../utils/sweetalert";

const PAGE_SIZE = 20;
const TOPIC_TITLES = new Map(GRAMMAR_TOPICS.map(({ id, title }) => [id, title]));

function getModuleTitle(module) {
  return TOPIC_TITLES.get(module) || module || "Unassigned";
}

function formatTimestamp(value) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
}

export default function GrammarMonitorTab() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [busyAction, setBusyAction] = useState("");

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await apiClient.get("/grammar/questions");
      if (!response.data?.success || !Array.isArray(response.data.data)) {
        throw new Error("The grammar question list could not be loaded.");
      }
      setQuestions(response.data.data);
    } catch (error) {
      console.error("Failed to load grammar monitor data:", error);
      setLoadError(error.message || "The grammar question list could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const groups = useMemo(() => {
    const grouped = new Map();
    for (const question of questions) {
      const module = question.module || "unassigned";
      const current = grouped.get(module) || { module, count: 0, latestActivity: null };
      current.count += 1;
      if (
        question.createdAt &&
        (!current.latestActivity || new Date(question.createdAt) > new Date(current.latestActivity))
      ) {
        current.latestActivity = question.createdAt;
      }
      grouped.set(module, current);
    }
    return [...grouped.values()].sort((a, b) => b.count - a.count);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return questions.filter((question) => {
      const matchesModule = moduleFilter === "all" || question.module === moduleFilter;
      const matchesSearch = !term || [
        question.module,
        question.question,
        question.answer,
        question.explanation,
        ...(Array.isArray(question.options) ? question.options : []),
      ].some((value) => String(value || "").toLocaleLowerCase().includes(term));
      return matchesModule && matchesSearch;
    });
  }, [questions, search, moduleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const visibleQuestions = filteredQuestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const newestQuestion = questions.find((question) => question.createdAt);

  useEffect(() => {
    setPage(1);
  }, [search, moduleFilter]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const handleDeleteQuestion = async (question) => {
    const confirmation = await showConfirmModal({
      title: "Delete this grammar question?",
      text: question.question,
      confirmButtonText: "Delete Question",
      isDanger: true,
      icon: "warning",
    });
    if (!confirmation.isConfirmed) return;

    setBusyAction(`question:${question.id}`);
    try {
      await apiClient.delete(`/grammar/questions/${encodeURIComponent(question.id)}`);
      setQuestions((current) => current.filter((entry) => entry.id !== question.id));
      showSuccessToast("Question Deleted", "The grammar question was removed.");
    } catch (error) {
      console.error("Failed to delete grammar question:", error);
      showErrorAlert("Delete Failed", error.message || "The grammar question could not be deleted.");
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteGroup = async (group) => {
    const confirmation = await showConfirmModal({
      title: `Delete all questions in "${getModuleTitle(group.module)}"?`,
      text: `This permanently deletes ${group.count} grammar question${group.count === 1 ? "" : "s"} from this module.`,
      confirmButtonText: "Delete Question Group",
      isDanger: true,
      icon: "warning",
    });
    if (!confirmation.isConfirmed) return;

    setBusyAction(`module:${group.module}`);
    try {
      const response = await apiClient.delete("/grammar/questions", {
        data: { module: group.module },
      });
      setQuestions((current) => current.filter((question) => question.module !== group.module));
      showSuccessToast(
        "Question Group Deleted",
        `${response.data.deletedCount} question${response.data.deletedCount === 1 ? "" : "s"} removed.`,
      );
    } catch (error) {
      console.error("Failed to delete grammar question group:", error);
      showErrorAlert("Delete Failed", error.message || "The grammar question group could not be deleted.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <section className="imlaa-card space-y-6 p-6 sm:p-8">
      <header className="flex flex-col gap-3 border-b border-plum/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold text-body-dark">
            <HiAcademicCap className="h-6 w-6 text-plum" />
            Grammar Question Activity
          </h3>
          <p className="mt-1 text-sm text-muted-label">
            Review recently added questions, inspect module totals, and remove incorrect entries.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchQuestions}
          disabled={loading}
          className="imlaa-btn-secondary min-h-11 px-4 text-sm font-bold"
        >
          <HiArrowPath className={`mr-2 inline h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-plum/15 bg-plum/5 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-label">Questions</div>
          <div className="mt-1 text-2xl font-black text-plum">{questions.length}</div>
        </div>
        <div className="rounded-xl border border-plum/15 bg-plum/5 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-label">Modules</div>
          <div className="mt-1 text-2xl font-black text-plum">{groups.length}</div>
        </div>
        <div className="rounded-xl border border-plum/15 bg-plum/5 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-label">Latest Question</div>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-body-dark">
            <HiClock className="h-4 w-4 shrink-0 text-plum" />
            {formatTimestamp(newestQuestion?.createdAt)}
          </div>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-body-dark">Question groups</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((group) => (
              <article
                key={group.module}
                className="flex flex-col justify-between gap-3 rounded-xl border border-plum/15 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <h5 className="font-bold text-plum">{getModuleTitle(group.module)}</h5>
                  <p className="mt-1 text-sm text-muted-label">
                    {group.count} question{group.count === 1 ? "" : "s"} · Latest: {formatTimestamp(group.latestActivity)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(group)}
                  disabled={Boolean(busyAction)}
                  className="imlaa-btn-secondary min-h-11 shrink-0 border-rose-300 px-3 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  <HiTrash className="mr-2 inline h-4 w-4" />
                  Delete Group
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-plum/10 pt-4 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search grammar questions</span>
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-plum" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search question, answer, option, or module..."
            className="imlaa-input min-h-11 w-full pl-10"
          />
        </label>
        <label>
          <span className="sr-only">Filter by grammar module</span>
          <select
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            className="imlaa-input min-h-11 w-full sm:min-w-64"
          >
            <option value="all">All modules</option>
            {groups.map((group) => (
              <option key={group.module} value={group.module}>{getModuleTitle(group.module)}</option>
            ))}
          </select>
        </label>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center font-semibold text-plum">Loading grammar activity...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-8 text-center text-muted-label">
          {questions.length ? "No questions match your search." : "No grammar questions have been uploaded yet."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-muted-label">
                <tr className="border-b border-plum/20">
                  <th className="p-3">Module</th>
                  <th className="p-3">Question</th>
                  <th className="p-3">Answer</th>
                  <th className="p-3">Added</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {visibleQuestions.map((question) => (
                  <tr key={question.id} className="align-top hover:bg-plum/5">
                    <td className="p-3 font-semibold text-plum">{getModuleTitle(question.module)}</td>
                    <td className="max-w-lg p-3">
                      <div className="font-semibold text-body-dark">{question.question}</div>
                      {Array.isArray(question.options) && (
                        <div className="mt-1 text-xs text-muted-label">
                          Options: {question.options.join(" · ")}
                        </div>
                      )}
                      {question.explanation && (
                        <div className="mt-1 text-xs text-muted-label">Explanation: {question.explanation}</div>
                      )}
                    </td>
                    <td className="p-3 font-bold text-emerald-700">{question.answer}</td>
                    <td className="whitespace-nowrap p-3 text-xs text-muted-label">
                      {formatTimestamp(question.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(question)}
                        disabled={Boolean(busyAction)}
                        title="Delete question"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-label transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        <HiTrash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-plum/10 pt-4 text-sm sm:flex-row">
            <span className="text-muted-label">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredQuestions.length)} of {filteredQuestions.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="imlaa-btn-secondary min-h-11 px-4 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="font-semibold text-body-dark">Page {page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="imlaa-btn-secondary min-h-11 px-4 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
