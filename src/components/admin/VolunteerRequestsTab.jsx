/**
 * Volunteer Requests tab (src/components/admin/VolunteerRequestsTab.jsx)
 * Admin review queue for public volunteer applications. Shows the structured
 * profile, the final customized message, status workflow, and direct contact
 * actions (Gmail / WhatsApp).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiArrowPath,
  HiChatBubbleLeftRight,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiChevronUp,
  HiEnvelope,
  HiInbox,
  HiMagnifyingGlass,
} from "react-icons/hi2";
import {
  listVolunteerApplications,
  updateVolunteerApplicationStatus,
} from "../../services/volunteerService";
import {
  VOLUNTEER_STATUSES,
  VOLUNTEER_STATUS_LABELS,
  buildWhatsAppLink,
  getVolunteerTrack,
} from "../../utils/volunteerApplication";
import { showErrorAlert, showSuccessToast } from "../../utils/sweetalert";

const PAGE_SIZE = 8;

const STATUS_STYLES = {
  new: "bg-rose-100 text-rose-800",
  reviewed: "bg-amber-100 text-amber-900",
  contacted: "bg-emerald-100 text-emerald-800",
};

function formatTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        STATUS_STYLES[status] || "bg-plum/10 text-plum"
      }`}
    >
      {VOLUNTEER_STATUS_LABELS[status] || status}
    </span>
  );
}

export default function VolunteerRequestsTab({ onApplicationsChanged }) {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listVolunteerApplications());
    } catch (loadError) {
      console.error("Could not load volunteer applications:", loadError);
      setError(loadError.message || "Volunteer applications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const counts = useMemo(
    () => ({
      all: items.length,
      new: items.filter((item) => item.status === "new").length,
      reviewed: items.filter((item) => item.status === "reviewed").length,
      contacted: items.filter((item) => item.status === "contacted").length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return [
        item.fullName,
        item.designation,
        item.gmail,
        item.country,
        getVolunteerTrack(item.track)?.label,
        item.experience,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [items, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pageItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleStatusChange = async (item, nextStatus) => {
    if (item.status === nextStatus) return;
    setBusyId(item.id);
    try {
      await updateVolunteerApplicationStatus(item.id, nextStatus);
      setItems((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, status: nextStatus } : row,
        ),
      );
      showSuccessToast(
        "Application updated",
        `${item.fullName} marked as ${VOLUNTEER_STATUS_LABELS[nextStatus].toLowerCase()}.`,
      );
      onApplicationsChanged?.();
    } catch (updateError) {
      console.error("Could not update volunteer application:", updateError);
      showErrorAlert(
        "Update failed",
        updateError.message || "The application status could not be changed.",
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="space-y-4" aria-label="Volunteer requests">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-body-dark">Volunteer requests</h3>
          <p className="mt-1 text-sm text-muted-label">
            Public applications from developers and English-language contributors.
            Every applicant should receive a prompt response.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="imlaa-btn-secondary min-h-11 px-4 text-sm font-semibold disabled:opacity-50"
        >
          <HiArrowPath
            className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[["all", "All"], ...VOLUNTEER_STATUSES.map((status) => [status, VOLUNTEER_STATUS_LABELS[status]])].map(
          ([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`min-h-11 rounded-xl px-3.5 text-sm font-semibold transition ${
                statusFilter === value
                  ? "bg-plum text-white"
                  : "border border-plum/20 bg-white text-plum hover:bg-plum/5"
              }`}
            >
              {label} ({counts[value]})
            </button>
          ),
        )}

        <label className="relative ml-auto block min-w-56 flex-1 sm:max-w-xs">
          <span className="sr-only">Search volunteer applications</span>
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-label"
            aria-hidden="true"
          />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, Gmail, country…"
            className="imlaa-input min-h-11 pl-9 text-sm"
          />
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p role="status" className="imlaa-card p-8 text-center text-muted-label">
          Loading volunteer applications…
        </p>
      ) : pageItems.length === 0 ? (
        !error ? (
          <div className="imlaa-card flex flex-col items-center gap-2 p-8 text-center">
            <HiInbox className="h-8 w-8 text-plum" aria-hidden="true" />
            <p className="text-sm font-semibold text-body-dark">
              {items.length === 0
                ? "No volunteer applications yet."
                : "No applications match this filter."}
            </p>
            <p className="max-w-md text-xs text-muted-label">
              New public submissions appear here automatically and also raise a
              notification in the bell menu.
            </p>
          </div>
        ) : null
      ) : (
        <div className="space-y-3">
          {pageItems.map((item) => {
            const track = getVolunteerTrack(item.track);
            const expanded = expandedId === item.id;
            const whatsappLink = buildWhatsAppLink(item.whatsapp);
            const mailto = `mailto:${item.gmail}?subject=${encodeURIComponent(
              `SpellyCraft volunteer application — ${item.fullName}`,
            )}`;

            return (
              <article key={item.id} className="imlaa-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-body-dark">
                        {item.fullName}
                      </h4>
                      <span className="inline-flex rounded-full bg-plum/10 px-2.5 py-0.5 text-[10px] font-bold text-plum">
                        {track?.shortLabel || item.track}
                      </span>
                      <StatusPill status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-label">
                      {item.designation} · {item.country}
                    </p>
                  </div>
                  <time
                    dateTime={item.createdAt}
                    className="text-xs text-muted-label"
                  >
                    {formatTimestamp(item.createdAt)}
                  </time>
                </div>

                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <dt className="sr-only">Gmail</dt>
                    <HiEnvelope className="h-4 w-4 shrink-0 text-plum" aria-hidden="true" />
                    <dd className="truncate">
                      <a
                        href={mailto}
                        className="font-semibold text-plum underline decoration-plum/30 underline-offset-2"
                      >
                        {item.gmail}
                      </a>
                    </dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <dt className="sr-only">WhatsApp</dt>
                    <HiChatBubbleLeftRight
                      className="h-4 w-4 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                    <dd className="truncate">
                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-emerald-800 underline decoration-emerald-700/30 underline-offset-2"
                        >
                          {item.whatsapp}
                        </a>
                      ) : (
                        <span className="text-muted-label">{item.whatsapp}</span>
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-plum/10 pt-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-label">
                    Status
                    <select
                      value={item.status}
                      onChange={(event) =>
                        handleStatusChange(item, event.target.value)
                      }
                      disabled={busyId === item.id}
                      aria-label={`Status for ${item.fullName}`}
                      className="imlaa-input min-h-11 w-auto py-1.5 pl-3 pr-8 text-sm font-semibold disabled:opacity-50"
                    >
                      {VOLUNTEER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {VOLUNTEER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    aria-expanded={expanded}
                    className="imlaa-btn-secondary min-h-11 px-3 text-xs font-semibold"
                  >
                    {expanded ? (
                      <HiChevronUp className="mr-1 h-4 w-4" aria-hidden="true" />
                    ) : (
                      <HiChevronDown className="mr-1 h-4 w-4" aria-hidden="true" />
                    )}
                    {expanded ? "Hide full application" : "View full application"}
                  </button>

                  <a
                    href={mailto}
                    className="imlaa-btn-primary min-h-11 px-3 text-xs font-bold"
                  >
                    <HiEnvelope className="mr-1 h-4 w-4" aria-hidden="true" />
                    Reply via Gmail
                  </a>

                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <HiChatBubbleLeftRight
                        className="mr-1 h-4 w-4"
                        aria-hidden="true"
                      />
                      Message on WhatsApp
                    </a>
                  )}
                </div>

                {expanded && (
                  <div className="mt-3 grid gap-3 border-t border-plum/10 pt-3 lg:grid-cols-2">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-label">
                        Previous experience &amp; relevant skills
                      </h5>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-body-dark">
                        {item.experience}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-label">
                        Submitted application message
                      </h5>
                      <pre className="mt-1 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-plum/15 bg-plum/5 p-3 font-mono text-xs leading-relaxed text-body-dark">
                        {item.message}
                      </pre>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-label">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredItems.length)} of{" "}
            {filteredItems.length} applications
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-plum/20 bg-white text-plum disabled:opacity-40"
            >
              <HiChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="px-2 font-semibold text-body-dark">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-plum/20 bg-white text-plum disabled:opacity-40"
            >
              <HiChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
