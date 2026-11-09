import { useCallback, useEffect, useState } from "react";
import {
  deleteAttribution,
  listAdminAttributions,
  saveAttribution,
} from "../../services/communityService";
import {
  showConfirmModal,
  showErrorAlert,
  showSuccessToast,
} from "../../utils/sweetalert";

const CONTRIBUTION_TYPES = [
  "Verified bug report",
  "Implemented feature idea",
  "Merged pull request",
  "Resource contribution",
  "Community review",
  "Other",
];

export default function CommunityAttributionPanel() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    displayName: "",
    contributionType: CONTRIBUTION_TYPES[0],
    summary: "",
    evidenceUrl: "",
  });
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listAdminAttributions());
    } catch (loadError) {
      console.error("Could not load contributor recognition:", loadError);
      setError(loadError.message || "Contributor recognition could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveAttribution({
        display_name: form.displayName,
        contribution_type: form.contributionType,
        summary: form.summary,
        evidence_url: form.evidenceUrl,
        consent_confirmed: consentConfirmed,
        is_approved: false,
      });
      setForm({
        displayName: "",
        contributionType: CONTRIBUTION_TYPES[0],
        summary: "",
        evidenceUrl: "",
      });
      setConsentConfirmed(false);
      showSuccessToast("Recognition record added");
      await load();
    } catch (saveError) {
      console.error("Could not save contributor recognition:", saveError);
      setError(saveError.message || "The recognition record could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const update = async (item, changes) => {
    try {
      await saveAttribution({
        id: item.id,
        display_name: item.display_name,
        contribution_type: item.contribution_type,
        summary: item.summary,
        evidence_url: item.evidence_url,
        source_ticket_id: item.source_ticket_id,
        consent_confirmed: changes.consent_confirmed ?? item.consent_confirmed,
        is_approved: changes.is_approved ?? item.is_approved,
      });
      showSuccessToast("Recognition updated");
      await load();
    } catch (updateError) {
      console.error("Could not update contributor recognition:", updateError);
      setError(updateError.message || "The recognition record could not be updated.");
    }
  };

  const remove = async (item) => {
    const result = await showConfirmModal({
      title: "Delete recognition record?",
      text: `Remove the public recognition record for ${item.display_name}?`,
      confirmButtonText: "Delete record",
      cancelButtonText: "Cancel",
      isDanger: true,
      icon: "warning",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteAttribution(item.id);
      showSuccessToast("Recognition record deleted");
      await load();
    } catch (deleteError) {
      console.error("Could not delete contributor recognition:", deleteError);
      showErrorAlert("Delete failed", deleteError.message || "The record could not be deleted.");
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-xl font-black text-body-dark">Verified contributor recognition</h3>
        <p className="mt-1 text-sm text-muted-label">
          Add only verifiable contributions. Publishing requires explicit permission to display the person’s name.
        </p>
      </div>
      <form onSubmit={submit} className="imlaa-card grid gap-4 p-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-body-dark">
          Display name
          <input
            value={form.displayName}
            onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
            maxLength={100}
            required
            className="imlaa-input mt-2 min-h-11"
          />
        </label>
        <label className="text-sm font-semibold text-body-dark">
          Contribution type
          <select
            value={form.contributionType}
            onChange={(event) => setForm((current) => ({ ...current, contributionType: event.target.value }))}
            className="imlaa-input mt-2 min-h-11"
          >
            {CONTRIBUTION_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-body-dark sm:col-span-2">
          Summary
          <textarea
            value={form.summary}
            onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            maxLength={1200}
            required
            rows={3}
            className="imlaa-input mt-2 resize-y"
          />
        </label>
        <label className="text-sm font-semibold text-body-dark sm:col-span-2">
          Evidence URL
          <input
            type="url"
            value={form.evidenceUrl}
            onChange={(event) => setForm((current) => ({ ...current, evidenceUrl: event.target.value }))}
            placeholder="https://"
            required
            className="imlaa-input mt-2 min-h-11"
          />
        </label>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-body-dark sm:col-span-2">
          <input
            type="checkbox"
            checked={consentConfirmed}
            onChange={(event) => setConsentConfirmed(event.target.checked)}
            className="mt-1 h-4 w-4 accent-plum"
          />
          <span>I have verified that the contributor gave permission for this public recognition.</span>
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="imlaa-btn-primary min-h-11 px-5 text-sm font-bold disabled:opacity-50">
            {busy ? "Saving…" : "Add recognition record"}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {loading ? (
        <p role="status" className="imlaa-card p-8 text-center text-muted-label">Loading recognition records…</p>
      ) : items.length ? items.map((item) => (
        <article key={item.id} className="imlaa-card space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-body-dark">{item.display_name}</h4>
              <p className="text-xs text-muted-label">{item.contribution_type}</p>
            </div>
            <span className="rounded-full bg-plum/10 px-3 py-1 text-xs font-bold text-plum">
              {item.is_approved && item.consent_confirmed ? "Published" : "Not published"}
            </span>
          </div>
          <p className="text-sm text-muted-label">{item.summary}</p>
          <a href={item.evidence_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-plum underline">
            Open evidence
          </a>
          <p className="text-sm text-muted-label">
            Permission to display name: {item.consent_confirmed ? "confirmed" : "not confirmed"}
          </p>
          <div className="flex flex-wrap gap-2 border-t border-plum/10 pt-3">
            {!item.consent_confirmed && (
              <button type="button" onClick={() => update(item, { consent_confirmed: true })} className="imlaa-btn-secondary min-h-11 px-4 text-sm">
                Confirm permission verified
              </button>
            )}
            {item.is_approved ? (
              <button type="button" onClick={() => update(item, { is_approved: false })} className="imlaa-btn-secondary min-h-11 px-4 text-sm">
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                disabled={!item.consent_confirmed}
                onClick={() => update(item, { is_approved: true })}
                className="imlaa-btn-primary min-h-11 px-4 text-sm font-bold disabled:opacity-50"
              >
                Publish
              </button>
            )}
            <button type="button" onClick={() => remove(item)} className="min-h-11 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-800 hover:bg-rose-50">
              Delete
            </button>
          </div>
        </article>
      )) : !error ? (
        <p className="imlaa-card p-8 text-center text-muted-label">No contributor records yet.</p>
      ) : null}
    </section>
  );
}
