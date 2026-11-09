import { useCallback, useEffect, useState } from "react";
import {
  listAdminDeveloperApplications,
  listAdminDeveloperProfiles,
  listAdminTickets,
  reviewCommunityTicket,
  reviewDeveloperApplication,
  reviewDeveloperProfile,
} from "../../services/communityService";
import { showSuccessToast } from "../../utils/sweetalert";
import CommunityAttributionPanel from "./CommunityAttributionPanel";

const TICKET_STATUSES = ["pending", "active", "resolved", "closed"];
const APPLICATION_STATUSES = ["under_review", "approved", "rejected"];

function ErrorMessage({ children }) {
  return children ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{children}</p> : null;
}

function TicketReviewCard({ ticket, onReviewed }) {
  const [status, setStatus] = useState(ticket.status);
  const [isPublic, setIsPublic] = useState(Boolean(ticket.is_public));
  const [note, setNote] = useState(ticket.resolution_note || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await reviewCommunityTicket({ id: ticket.id, status, isPublic, resolutionNote: note });
      showSuccessToast("Request moderation saved");
      await onReviewed();
    } catch (saveError) {
      console.error("Could not review community request:", saveError);
      setError(saveError.message || "The request could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="imlaa-card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-plum/10 px-3 py-1 capitalize text-plum">{ticket.request_type === "bug" ? "Bug report" : "Feature idea"}</span>
            <span className="rounded-full border border-plum/15 px-3 py-1 text-muted-label">{ticket.category}</span>
          </div>
          <h3 className="mt-3 text-lg font-bold text-body-dark">{ticket.title}</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-label">{ticket.description}</p>
        </div>
        <time className="text-xs text-muted-label" dateTime={ticket.created_at}>{new Date(ticket.created_at).toLocaleDateString()}</time>
      </div>
      {ticket.request_type === "bug" && (
        <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div><dt className="font-bold text-body-dark">Reproduction steps</dt><dd className="mt-1 whitespace-pre-line text-muted-label">{ticket.steps_to_reproduce}</dd></div>
          <div><dt className="font-bold text-body-dark">Expected</dt><dd className="mt-1 whitespace-pre-line text-muted-label">{ticket.expected_behavior}</dd></div>
          <div><dt className="font-bold text-body-dark">Actual</dt><dd className="mt-1 whitespace-pre-line text-muted-label">{ticket.actual_behavior}</dd></div>
        </dl>
      )}
      {ticket.affected_page && <p className="text-sm"><strong>Affected page:</strong> <span className="text-muted-label">{ticket.affected_page}</span></p>}
      {ticket.related_url && <a className="text-sm font-semibold text-plum underline" href={ticket.related_url} target="_blank" rel="noopener noreferrer">Open related URL</a>}
      <div className="grid gap-4 border-t border-plum/10 pt-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-body-dark">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="imlaa-input mt-2 min-h-11">
            {TICKET_STATUSES.map((value) => <option key={value} value={value}>{value.replace("_", " ")}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold text-body-dark">
          <input type="checkbox" checked={isPublic} disabled={status === "pending"} onChange={(event) => setIsPublic(event.target.checked)} className="h-4 w-4 accent-plum" />
          Publish on the public community board
        </label>
        <label className="text-sm font-semibold text-body-dark sm:col-span-2">
          Resolution / moderator note
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={2} className="imlaa-input mt-2 resize-y" />
        </label>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      <button type="button" onClick={save} disabled={busy} className="imlaa-btn-primary min-h-11 px-5 text-sm font-bold disabled:opacity-50">
        {busy ? "Saving…" : "Save review"}
      </button>
    </article>
  );
}

function CommunityRequestsPanel() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listAdminTickets({ status }));
    } catch (loadError) {
      console.error("Could not load community requests for moderation:", loadError);
      setError(loadError.message || "Community requests could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-body-dark">Community request moderation</h3>
          <p className="mt-1 text-sm text-muted-label">New tickets remain private until reviewed and explicitly published.</p>
        </div>
        <label className="text-sm font-semibold text-body-dark">
          Filter
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="imlaa-input ml-2 min-h-11">
            <option value="all">All statuses</option>
            {TICKET_STATUSES.map((value) => <option key={value} value={value}>{value.replace("_", " ")}</option>)}
          </select>
        </label>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <p role="status" className="imlaa-card p-8 text-center text-muted-label">Loading requests…</p> : items.length ? items.map((ticket) => (
        <TicketReviewCard key={ticket.id} ticket={ticket} onReviewed={load} />
      )) : !error ? <p className="imlaa-card p-8 text-center text-muted-label">No requests match this filter.</p> : null}
    </section>
  );
}

function DeveloperApplicationsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [drafts, setDrafts] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const applications = await listAdminDeveloperApplications();
      setItems(applications);
      setDrafts(Object.fromEntries(applications.map((item) => [item.id, {
        status: item.status === "pending" ? "under_review" : item.status,
        notes: item.reviewer_notes || "",
      }])));
    } catch (loadError) {
      console.error("Could not load developer applications:", loadError);
      setError(loadError.message || "Developer applications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (item) => {
    const draft = drafts[item.id];
    setSavingId(item.id);
    setError("");
    try {
      await reviewDeveloperApplication(item.id, draft.status, draft.notes);
      showSuccessToast("Application review saved");
      await load();
    } catch (saveError) {
      console.error("Could not review developer application:", saveError);
      setError(saveError.message || "The application review could not be saved.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-black text-body-dark">Developer applications</h3>
        <p className="mt-1 text-sm text-muted-label">Review private applications before allowing profile creation.</p>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <p role="status" className="imlaa-card p-8 text-center text-muted-label">Loading applications…</p> : items.length ? items.map((item) => {
        const draft = drafts[item.id] || { status: "under_review", notes: "" };
        const isOpen = ["pending", "under_review"].includes(item.status);
        return (
          <article key={item.id} className="imlaa-card space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-body-dark">{item.display_name}</h4>
                <p className="text-xs text-muted-label">{item.status.replace("_", " ")} · {new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <span className="rounded-full bg-plum/10 px-3 py-1 text-xs font-bold text-plum">{item.user_id}</span>
            </div>
            <p className="text-sm"><strong>Skills:</strong> <span className="text-muted-label">{item.skills}</span></p>
            {item.experience && <p className="whitespace-pre-line text-sm"><strong>Experience:</strong> <span className="text-muted-label">{item.experience}</span></p>}
            <p className="whitespace-pre-line text-sm"><strong>Motivation:</strong> <span className="text-muted-label">{item.motivation}</span></p>
            <div className="flex flex-wrap gap-4 text-sm">
              {item.github_url && <a href={item.github_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-plum underline">GitHub profile</a>}
              {item.portfolio_url && <a href={item.portfolio_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-plum underline">Portfolio</a>}
            </div>
            {isOpen ? (
              <>
                <div className="grid gap-4 border-t border-plum/10 pt-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-body-dark">
                    Review decision
                    <select value={draft.status} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, status: event.target.value } }))} className="imlaa-input mt-2 min-h-11">
                      {APPLICATION_STATUSES.map((value) => <option key={value} value={value}>{value.replace("_", " ")}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-body-dark sm:col-span-2">
                    Reviewer note (private)
                    <textarea value={draft.notes} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, notes: event.target.value } }))} maxLength={2000} rows={2} className="imlaa-input mt-2 resize-y" />
                  </label>
                </div>
                <button type="button" onClick={() => save(item)} disabled={savingId === item.id} className="imlaa-btn-primary min-h-11 px-5 text-sm font-bold disabled:opacity-50">
                  {savingId === item.id ? "Saving…" : "Save decision"}
                </button>
              </>
            ) : (
              <p className="border-t border-plum/10 pt-3 text-sm text-muted-label">This application is closed. The applicant may submit a new application if eligible.</p>
            )}
          </article>
        );
      }) : !error ? <p className="imlaa-card p-8 text-center text-muted-label">No developer applications yet.</p> : null}
    </section>
  );
}

function DeveloperProfilesPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listAdminDeveloperProfiles());
    } catch (loadError) {
      console.error("Could not load developer profiles for review:", loadError);
      setError(loadError.message || "Developer profiles could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (item, approved) => {
    try {
      await reviewDeveloperProfile(item.user_id, approved);
      showSuccessToast(approved ? "Profile approved" : "Profile approval removed");
      await load();
    } catch (reviewError) {
      console.error("Could not review developer profile:", reviewError);
      setError(reviewError.message || "The profile could not be reviewed.");
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-black text-body-dark">Developer profile approval</h3>
        <p className="mt-1 text-sm text-muted-label">Only approved and opted-in profiles are visible in the public directory.</p>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <p role="status" className="imlaa-card p-8 text-center text-muted-label">Loading profiles…</p> : items.length ? items.map((item) => (
        <article key={item.user_id} className="imlaa-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h4 className="font-bold text-body-dark">{item.display_name}</h4>
            <p className="text-sm text-muted-label">{item.is_public ? "Opted in to public listing" : "Private"} · {item.is_approved ? "Approved" : "Awaiting approval"}</p>
            <p className="mt-1 text-xs text-muted-label">User: {item.user_id}</p>
          </div>
          {item.is_approved ? (
            <button type="button" onClick={() => review(item, false)} className="imlaa-btn-secondary min-h-11 px-4 text-sm font-semibold">Revoke approval</button>
          ) : (
            <button type="button" onClick={() => review(item, true)} className="imlaa-btn-primary min-h-11 px-4 text-sm font-bold">Approve profile</button>
          )}
        </article>
      )) : !error ? <p className="imlaa-card p-8 text-center text-muted-label">No developer profiles to review.</p> : null}
    </section>
  );
}

const SECTIONS = [
  ["requests", "Requests"],
  ["applications", "Developer applications"],
  ["profiles", "Profile approvals"],
  ["attributions", "Contributor recognition"],
];

export default function CommunityModerationTab() {
  const [section, setSection] = useState("requests");

  return (
    <div className="space-y-5">
      <nav aria-label="Community moderation sections" className="flex flex-wrap gap-2 border-b border-plum/15 pb-3">
        {SECTIONS.map(([key, label]) => (
          <button key={key} type="button" aria-pressed={section === key} onClick={() => setSection(key)} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${section === key ? "bg-plum text-white" : "border border-plum/20 bg-white text-plum hover:bg-plum/5"}`}>
            {label}
          </button>
        ))}
      </nav>
      {section === "requests" && <CommunityRequestsPanel />}
      {section === "applications" && <DeveloperApplicationsPanel />}
      {section === "profiles" && <DeveloperProfilesPanel />}
      {section === "attributions" && <CommunityAttributionPanel />}
    </div>
  );
}
