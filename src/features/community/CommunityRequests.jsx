import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  HiBugAnt,
  HiChevronLeft,
  HiChevronRight,
  HiLightBulb,
  HiMagnifyingGlass,
} from "react-icons/hi2";
import { useAuth } from "../../context/AuthContext";
import {
  listMyTickets,
  listPublicTickets,
  submitCommunityTicket,
} from "../../services/communityService";
import { COMMUNITY_CATEGORIES } from "./communityValidation";
import { showSuccessToast } from "../../utils/sweetalert";
import { useModalEffects } from "../../hooks/useModalEffects";

const PAGE_SIZE = 6;
const INITIAL_DRAFT = {
  requestType: "feature",
  title: "",
  description: "",
  category: "General",
  stepsToReproduce: "",
  expectedBehavior: "",
  actualBehavior: "",
  affectedPage: "",
  relatedUrl: "",
  allowPublicCredit: false,
  publicDisplayName: "",
};

const STATUS_LABELS = {
  pending: "Under review",
  active: "Active",
  resolved: "Resolved",
  closed: "Closed",
};

function RequestCard({ ticket }) {
  const isBug = ticket.request_type === "bug";
  return (
    <article className="group flex flex-col items-start justify-between gap-4 rounded-xl border border-plum-border/35 bg-white p-5 shadow-sm transition hover:border-plum/35 hover:shadow-md md:flex-row md:items-center md:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isBug ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
          {isBug ? <HiBugAnt className="h-5 w-5" aria-hidden="true" /> : <HiLightBulb className="h-5 w-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-body-dark sm:text-lg">{ticket.title}</h3>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isBug ? "bg-rose-50 text-rose-800" : "bg-plum/10 text-plum"}`}>
              {isBug ? "Bug report" : "Feature"}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              ticket.status === "resolved"
                ? "bg-emerald-50 text-emerald-800"
                : ticket.status === "closed"
                  ? "bg-slate-100 text-slate-700"
                    : "bg-plum/5 text-plum"
            }`}>
              {STATUS_LABELS[ticket.status] || ticket.status}
            </span>
          </div>
          <p className="mt-1 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-label">{ticket.description}</p>
          {ticket.status === "resolved" && ticket.resolution_note && (
            <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
              <strong>Resolution:</strong> {ticket.resolution_note}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-label">
            <span>{ticket.category}</span>
            <span aria-hidden="true">·</span>
            <span>REQ-{ticket.id.slice(0, 8).toUpperCase()}</span>
            {ticket.public_display_name && (
              <>
                <span aria-hidden="true">·</span>
                <span>Submitted by {ticket.public_display_name}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <time dateTime={ticket.created_at}>{new Date(ticket.created_at).toLocaleDateString()}</time>
          </div>
        </div>
      </div>
    </article>
  );
}

function TicketForm({ onClose, onCreated, initialRequestType }) {
  const [draft, setDraft] = useState(() => ({
    ...INITIAL_DRAFT,
    requestType: initialRequestType,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const change = (event) => {
    const { name, value, checked, type } = event.target;
    setDraft((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await submitCommunityTicket(draft);
      setDraft(INITIAL_DRAFT);
      showSuccessToast("Request submitted", "An admin will review it before public posting.");
      onCreated();
      onClose();
    } catch (submitError) {
      console.error("Could not submit community request:", submitError);
      setError(submitError.message || "Your request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="imlaa-card space-y-5 border border-plum/25 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-body-dark">Share a request</h3>
          <p className="mt-1 text-sm text-muted-label">
            Requests are private until an admin reviews them. Don’t include passwords,
            private data, or sensitive account information.
          </p>
        </div>
        <button type="button" onClick={onClose} className="imlaa-btn-secondary min-h-11 px-4 text-sm">
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-body-dark">
          Request type
          <select name="requestType" value={draft.requestType} onChange={change} className="imlaa-input mt-2 min-h-11">
            <option value="feature">Feature suggestion</option>
            <option value="bug">Bug / problem</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-body-dark">
          Category
          <select name="category" value={draft.category} onChange={change} className="imlaa-input mt-2 min-h-11">
            {COMMUNITY_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
      </div>

      <label className="block text-sm font-semibold text-body-dark">
        Short title
        <input
          name="title"
          value={draft.title}
          onChange={change}
          minLength={4}
          maxLength={140}
          required
          className="imlaa-input mt-2 min-h-11"
          placeholder="Summarize your idea or issue"
        />
      </label>

      <label className="block text-sm font-semibold text-body-dark">
        Description
        <textarea
          name="description"
          value={draft.description}
          onChange={change}
          minLength={10}
          maxLength={4000}
          rows={4}
          required
          className="imlaa-input mt-2 resize-y"
          placeholder="What is the problem, or what would you like to be able to do?"
        />
      </label>

      {draft.requestType === "bug" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-body-dark sm:col-span-2">
            Steps to reproduce
            <textarea name="stepsToReproduce" value={draft.stepsToReproduce} onChange={change} maxLength={3000} rows={3} required className="imlaa-input mt-2 resize-y" />
          </label>
          <label className="text-sm font-semibold text-body-dark">
            Expected behavior
            <textarea name="expectedBehavior" value={draft.expectedBehavior} onChange={change} maxLength={1500} rows={3} required className="imlaa-input mt-2 resize-y" />
          </label>
          <label className="text-sm font-semibold text-body-dark">
            Actual behavior
            <textarea name="actualBehavior" value={draft.actualBehavior} onChange={change} maxLength={1500} rows={3} required className="imlaa-input mt-2 resize-y" />
          </label>
          <label className="text-sm font-semibold text-body-dark">
            Affected page/device (optional)
            <input name="affectedPage" value={draft.affectedPage} onChange={change} maxLength={500} className="imlaa-input mt-2 min-h-11" />
          </label>
          <label className="text-sm font-semibold text-body-dark">
            Related public URL (optional)
            <input name="relatedUrl" type="url" value={draft.relatedUrl} onChange={change} className="imlaa-input mt-2 min-h-11" placeholder="https://" />
          </label>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-plum/15 bg-plum/5 p-4">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-body-dark">
          <input type="checkbox" name="allowPublicCredit" checked={draft.allowPublicCredit} onChange={change} className="mt-1 h-4 w-4 accent-plum" />
          <span>Allow my name to be shown publicly if this request is approved. This is optional and separate from publishing the request.</span>
        </label>
        {draft.allowPublicCredit && (
          <label className="block text-sm font-semibold text-body-dark">
            Name to display publicly
            <input name="publicDisplayName" value={draft.publicDisplayName} onChange={change} maxLength={100} required className="imlaa-input mt-2 min-h-11" />
          </label>
        )}
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <button type="submit" disabled={submitting} className="imlaa-btn-primary min-h-12 px-6 font-bold disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}

export default function CommunityRequests({
  view = "board",
  openRequestSignal = 0,
  openRequestType = "feature",
}) {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requestType, setRequestType] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myRequestsError, setMyRequestsError] = useState("");
  const [showForm, setShowForm] = useState(false);
  useModalEffects(showForm, setShowForm, false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    setMyRequestsError("");
    try {
      if (view === "board") {
        try {
          const { data, count } = await listPublicTickets({ requestType, status, page, pageSize: PAGE_SIZE });
          setRequests(data);
          setTotal(count);
        } catch (loadError) {
          console.error("Could not load community requests:", loadError);
          setError("Community requests could not be loaded. Please try again.");
          setRequests([]);
          setTotal(0);
        }
      }

      if (view === "mine" && user?.id) {
        try {
          setMyRequests(await listMyTickets());
        } catch (loadError) {
          console.error("Could not load your community requests:", loadError);
          setMyRequests([]);
          setMyRequestsError("Your request history is temporarily unavailable.");
        }
      } else if (view !== "mine" || !user?.id) {
        setMyRequests([]);
      }
    } finally {
      setLoading(false);
    }
  }, [requestType, status, page, user?.id, view]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setShowForm(true);
      const next = new URLSearchParams(searchParams);
      next.delete("compose");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (openRequestSignal > 0) setShowForm(true);
  }, [openRequestSignal]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visibleRequests = requests.filter((ticket) => {
    const query = searchText.trim().toLowerCase();
    return !query || `${ticket.title} ${ticket.description} ${ticket.category} ${ticket.request_type} ${ticket.status}`.toLowerCase().includes(query);
  });

  return (
    <section id="community-requests" className="space-y-6">
      {view === "board" && (
        <>
      <div className="flex flex-col gap-4 rounded-xl border border-plum-border/30 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-plum">Community board</p>
          <h2 className="mt-1 text-2xl font-black text-body-dark">Ideas and issues, reviewed together</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-label">
            Requests are visible only after administrator review. Search the current page or narrow the list by type and status.
          </p>
        </div>
      </div>

      {showForm && isAuthenticated && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-body-dark/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-label="Submit community request" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <TicketForm
              key={`${openRequestSignal}-${openRequestType}`}
              onClose={() => setShowForm(false)}
              onCreated={loadRequests}
              initialRequestType={openRequestType}
            />
          </div>
        </div>
      )}
        </>
      )}

      {view === "mine" && isAuthenticated && (
        <section className="rounded-xl border border-plum-border/40 bg-white p-5 shadow-sm" aria-labelledby="my-request-status-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-plum">Private to your account</p>
              <h3 id="my-request-status-heading" className="mt-1 text-lg font-black text-body-dark">Your request status</h3>
            </div>
            <span className="text-sm text-muted-label">{myRequests.length} {myRequests.length === 1 ? "request" : "requests"}</span>
          </div>
          {myRequestsError ? (
            <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{myRequestsError}</p>
          ) : loading ? (
            <p role="status" className="mt-4 py-4 text-sm text-muted-label">Loading your request history…</p>
          ) : myRequests.length ? (
            <ul className="mt-3 divide-y divide-plum-border/25">
              {myRequests.map((ticket) => (
                <li key={ticket.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-body-dark">{ticket.title}</p>
                    <p className="mt-1 text-xs text-muted-label">
                      {ticket.request_type === "bug" ? "Problem report" : "Feature request"} · {ticket.category} · Submitted {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                    {ticket.resolution_note && (
                      <p className="mt-2 rounded-lg bg-plum/5 p-3 text-sm leading-relaxed text-body-dark">
                        <strong>Update:</strong> {ticket.resolution_note}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex min-h-8 shrink-0 items-center rounded-full px-3 text-xs font-bold ${
                    ticket.status === "resolved"
                      ? "bg-emerald-50 text-emerald-800"
                      : ticket.status === "closed"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-plum/5 text-plum"
                  }`}>
                    {STATUS_LABELS[ticket.status] || ticket.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-muted-label">
              You haven’t submitted a request yet. Your request and review status will appear here.
            </p>
          )}
        </section>
      )}
      {view === "board" && (
        <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 rounded-xl border border-plum-border/30 bg-white p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Search requests on this page</span>
            <HiMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-label" aria-hidden="true" />
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} className="imlaa-input min-h-11 pl-10" placeholder="Search this page..." />
          </label>
          <label>
            <span className="sr-only">Filter by request type</span>
            <select value={requestType} onChange={(event) => { setRequestType(event.target.value); setPage(1); }} className="imlaa-input min-h-11">
              <option value="all">All types</option>
              <option value="feature">Feature requests</option>
              <option value="bug">Bug reports</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by request status</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="imlaa-input min-h-11">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-muted-label" aria-live="polite">{total} published {total === 1 ? "request" : "requests"}</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</p>}
      {loading ? (
        <div className="imlaa-card p-10 text-center text-muted-label" role="status">Loading community requests…</div>
      ) : !error && visibleRequests.length ? (
        <div className="space-y-3">
          {visibleRequests.map((ticket) => <RequestCard key={ticket.id} ticket={ticket} />)}
        </div>
      ) : !error ? (
        <div className="rounded-xl border border-dashed border-plum-border/60 bg-white p-10 text-center">
          <h3 className="text-xl font-bold text-body-dark">{searchText ? "No requests match your search" : "No published requests here yet"}</h3>
          <p className="mt-2 text-muted-label">{searchText ? "Try another search term or clear the search field." : "New submissions are reviewed before appearing on this board."}</p>
        </div>
      ) : null}

      {!loading && !error && total > PAGE_SIZE && (
        <nav className="flex items-center justify-center gap-3" aria-label="Community request pages">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="imlaa-btn-secondary inline-flex min-h-11 items-center gap-1 px-4 disabled:opacity-50">
            <HiChevronLeft className="h-4 w-4" aria-hidden="true" />Previous
          </button>
          <span className="text-sm font-semibold text-body-dark">Page {page} of {pageCount}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount} className="imlaa-btn-secondary inline-flex min-h-11 items-center gap-1 px-4 disabled:opacity-50">
            Next<HiChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
        </>
      )}
    </section>
  );
}
