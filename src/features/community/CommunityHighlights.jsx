import { useEffect, useState } from "react";
import {
  HiArrowTopRightOnSquare,
  HiBriefcase,
  HiCheckBadge,
  HiUserGroup,
} from "react-icons/hi2";
import { Link, useLocation, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useModalEffects } from "../../hooks/useModalEffects";
import {
  listPublicAttributions,
  listPublicDeveloperProfiles,
  submitHireProposal,
} from "../../services/communityService";
import { showSuccessToast } from "../../utils/sweetalert";

export function VerifiedContributors() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listPublicAttributions()
      .then((data) => { if (active) setItems(data); })
      .catch((loadError) => {
        console.error("Could not load contributor highlights:", loadError);
        if (active) setError("Contributor highlights are temporarily unavailable.");
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-plum-border/30 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-plum">Recognition by evidence</p>
        <h2 className="mt-1 text-2xl font-black text-body-dark sm:text-3xl">Verified contributors</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-label">
          Recognition is published only after a maintainer verifies the contribution and confirms permission to display the contributor’s name.
        </p>
      </div>
      {error && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="flex flex-col items-center gap-4 rounded-xl border border-plum-border/35 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-plum text-lg font-black text-white">
                  {item.display_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                </span>
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white shadow" title="Verified contributor">
                  <HiCheckBadge className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-body-dark">{item.display_name}</h3>
                <p className="mt-1 text-xs text-muted-label">{item.contribution_type}</p>
              </div>
              <p className="w-full rounded-xl bg-plum/5 p-4 text-left text-sm leading-relaxed text-muted-label">{item.summary}</p>
              <a href={item.evidence_url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-plum underline underline-offset-2">
                View verified contribution<HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      ) : !error ? (
        <div className="rounded-xl border border-dashed border-plum-border/60 bg-white p-8 text-center text-muted-label">Contributor highlights are coming soon.</div>
      ) : null}
    </section>
  );
}

function HireForm({ profile, onClose }) {
  const [form, setForm] = useState({
    projectDescription: "",
    deliverables: "",
    desiredSkills: "",
    timeline: "",
    budgetRange: "",
    contactEmail: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await submitHireProposal(profile.user_id, form);
      showSuccessToast("Proposal sent", "Only you and the selected developer can view this proposal.");
      onClose();
    } catch (submitError) {
      console.error("Could not send developer proposal:", submitError);
      setError(submitError.message || "Proposal could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h3 className="text-xl font-black text-body-dark">Contact {profile.display_name}</h3>
        <p className="mt-1 text-sm text-muted-label">Your project details and contact email are private to you and the recipient.</p>
      </div>
      <label className="block text-sm font-semibold">Project description<textarea name="projectDescription" value={form.projectDescription} onChange={change} minLength={20} maxLength={4000} rows={4} required className="imlaa-input mt-2 resize-y" /></label>
      <label className="block text-sm font-semibold">Expected deliverables<textarea name="deliverables" value={form.deliverables} onChange={change} minLength={5} maxLength={2000} rows={3} required className="imlaa-input mt-2 resize-y" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Desired skills<input name="desiredSkills" value={form.desiredSkills} onChange={change} maxLength={1200} className="imlaa-input mt-2 min-h-11" /></label>
        <label className="block text-sm font-semibold">Timeline<input name="timeline" value={form.timeline} onChange={change} maxLength={300} className="imlaa-input mt-2 min-h-11" /></label>
        <label className="block text-sm font-semibold">Budget range (optional)<input name="budgetRange" value={form.budgetRange} onChange={change} maxLength={300} className="imlaa-input mt-2 min-h-11" /></label>
        <label className="block text-sm font-semibold">Your contact email<input name="contactEmail" type="email" value={form.contactEmail} onChange={change} maxLength={254} required className="imlaa-input mt-2 min-h-11" /></label>
      </div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="imlaa-btn-secondary min-h-11 px-4">Cancel</button>
        <button type="submit" disabled={busy} className="imlaa-btn-primary min-h-11 px-5 font-bold disabled:opacity-50">{busy ? "Sending…" : "Send private proposal"}</button>
      </div>
    </form>
  );
}

export function DeveloperDirectory() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  useModalEffects(selected, setSelected, null);

  useEffect(() => {
    let active = true;
    listPublicDeveloperProfiles()
      .then((data) => { if (active) setProfiles(data); })
      .catch((loadError) => {
        console.error("Could not load developer profiles:", loadError);
        if (active) setError("Developer profiles are temporarily unavailable.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const requestedProfileId = searchParams.get("hire");
    if (!requestedProfileId || loading) return;
    const profile = profiles.find((item) => item.user_id === requestedProfileId);
    if (profile) setSelected(profile);
    const next = new URLSearchParams(searchParams);
    next.delete("hire");
    setSearchParams(next, { replace: true });
  }, [loading, profiles, searchParams, setSearchParams]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-plum">Opt-in collaboration</p>
          <h2 className="mt-1 text-2xl font-black text-body-dark sm:text-3xl">Developers open to collaboration</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-label">Only approved profiles explicitly marked public are listed. Contact details are never published.</p>
        </div>
        <Link to="/workspace/community?tab=developer" className="imlaa-btn-secondary inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold">
          <HiUserGroup className="h-4 w-4" aria-hidden="true" />Apply or manage profile
        </Link>
      </div>
      {error && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {loading ? <p role="status" className="rounded-xl border border-plum-border/35 bg-white p-8 text-center text-muted-label">Loading public profiles…</p> : profiles.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <article key={profile.user_id} className="flex flex-col gap-4 rounded-xl border border-plum-border/35 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-plum/5 text-lg font-black text-plum">
                  {profile.display_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold text-body-dark">{profile.display_name}</h3>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                    <HiCheckBadge className="h-4 w-4" aria-hidden="true" />Verified public profile
                  </p>
                </div>
              </div>
              {profile.bio && <p className="text-sm leading-relaxed text-muted-label">{profile.bio}</p>}
              {profile.skills && (
                <div className="rounded-xl bg-plum/5 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-label">Skills</p>
                  <p className="mt-1 text-sm leading-relaxed text-body-dark">{profile.skills}</p>
                </div>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-plum-border/25 pt-3">
                {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center text-sm font-semibold text-plum underline underline-offset-2">GitHub</a>}
                {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center text-sm font-semibold text-plum underline underline-offset-2">Portfolio</a>}
                {isAuthenticated ? (
                  <button type="button" onClick={() => setSelected(profile)} className="imlaa-btn-primary ml-auto inline-flex min-h-11 items-center gap-2 px-4 text-sm font-bold">
                    <HiBriefcase className="h-4 w-4" aria-hidden="true" />Send proposal
                  </button>
                ) : (
                  <Link to="/login" state={{ from: { pathname: location.pathname, search: `?hire=${encodeURIComponent(profile.user_id)}` } }} className="imlaa-btn-primary ml-auto inline-flex min-h-11 items-center px-4 text-sm font-bold">
                    Sign in to contact
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : !error ? (
        <div className="rounded-xl border border-dashed border-plum-border/60 bg-white p-8 text-center text-muted-label">No public developer profiles are available yet. You can apply to join the directory.</div>
      ) : null}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div role="dialog" aria-modal="true" aria-label="Send developer proposal" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-plum-border/40 bg-white p-5 shadow-2xl sm:p-7">
            <HireForm profile={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}
    </section>
  );
}

export default function CommunityHighlights() {
  return (
    <div className="space-y-14">
      <VerifiedContributors />
      <DeveloperDirectory />
    </div>
  );
}
