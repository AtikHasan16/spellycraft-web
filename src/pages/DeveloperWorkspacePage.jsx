import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { HiArrowLeft, HiArrowPath, HiBriefcase, HiUserGroup } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import {
  getDeveloperWorkspace,
  respondToHireProposal,
  saveDeveloperProfile,
  submitDeveloperApplication,
  withdrawDeveloperApplication,
} from "../services/communityService";
import { showSuccessToast } from "../utils/sweetalert";

const EMPTY_APPLICATION = {
  displayName: "",
  skills: "",
  experience: "",
  githubUrl: "",
  portfolioUrl: "",
  motivation: "",
};

const EMPTY_PROFILE = {
  displayName: "",
  bio: "",
  skills: "",
  githubUrl: "",
  portfolioUrl: "",
  isPublic: false,
};

const STATUS_LABELS = {
  pending: "Awaiting review",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Not approved",
  withdrawn: "Withdrawn",
};

export function DeveloperApplicationForm({ onSubmitted }) {
  const [form, setForm] = useState(EMPTY_APPLICATION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await submitDeveloperApplication(form);
      setForm(EMPTY_APPLICATION);
      showSuccessToast("Application submitted", "You can track its status here.");
      await onSubmitted();
    } catch (submitError) {
      console.error("Could not submit developer application:", submitError);
      setError(submitError.message || "Your application could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-plum-border/40 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <h2 className="text-xl font-black text-body-dark">Apply to contribute as a developer</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-label">
          Applications are private to you and the administrators reviewing them. An approved application is required before creating a public profile.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-body-dark">
          Display name
          <input name="displayName" value={form.displayName} onChange={change} maxLength={100} required className="imlaa-input mt-2 min-h-11" />
        </label>
        <label className="text-sm font-semibold text-body-dark">
          Skills
          <input name="skills" value={form.skills} onChange={change} maxLength={1500} required className="imlaa-input mt-2 min-h-11" placeholder="For example: React, SQL, accessibility" />
        </label>
        <label className="text-sm font-semibold text-body-dark">
          GitHub profile (optional)
          <input name="githubUrl" type="url" value={form.githubUrl} onChange={change} className="imlaa-input mt-2 min-h-11" placeholder="https://github.com/username" />
        </label>
        <label className="text-sm font-semibold text-body-dark">
          Portfolio (optional)
          <input name="portfolioUrl" type="url" value={form.portfolioUrl} onChange={change} className="imlaa-input mt-2 min-h-11" placeholder="https://" />
        </label>
      </div>
      <label className="block text-sm font-semibold text-body-dark">
        Relevant experience (optional)
        <textarea name="experience" value={form.experience} onChange={change} maxLength={1500} rows={3} className="imlaa-input mt-2 resize-y" />
      </label>
      <label className="block text-sm font-semibold text-body-dark">
        What would you like to contribute?
        <textarea name="motivation" value={form.motivation} onChange={change} minLength={10} maxLength={3000} rows={5} required className="imlaa-input mt-2 resize-y" />
      </label>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <button type="submit" disabled={busy} className="imlaa-btn-primary min-h-11 px-5 font-bold disabled:opacity-50">
        {busy ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}

function DeveloperProfileForm({ userId, profile, onSaved }) {
  const [form, setForm] = useState(() => profile ? {
    displayName: profile.display_name || "",
    bio: profile.bio || "",
    skills: profile.skills || "",
    githubUrl: profile.github_url || "",
    portfolioUrl: profile.portfolio_url || "",
    isPublic: Boolean(profile.is_public),
  } : EMPTY_PROFILE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveDeveloperProfile(userId, form);
      showSuccessToast("Profile saved", "Public visibility may require administrator approval.");
      await onSaved();
    } catch (saveError) {
      console.error("Could not save developer profile:", saveError);
      setError(saveError.message || "Your profile could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-plum-border/40 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <h2 className="text-xl font-black text-body-dark">{profile ? "Manage your developer profile" : "Create your developer profile"}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-label">
          Your profile is not shown publicly until you opt in and an administrator approves it. Contact details are never displayed.
        </p>
      </div>
      {!profile?.is_approved && (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Profile approval is still pending. You can save the profile now, but it will not appear in the public directory until approved.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-body-dark">
          Public display name
          <input name="displayName" value={form.displayName} onChange={change} maxLength={100} required className="imlaa-input mt-2 min-h-11" />
        </label>
        <label className="text-sm font-semibold text-body-dark">
          Skills
          <input name="skills" value={form.skills} onChange={change} maxLength={1200} className="imlaa-input mt-2 min-h-11" />
        </label>
        <label className="text-sm font-semibold text-body-dark">
          GitHub profile (optional)
          <input name="githubUrl" type="url" value={form.githubUrl} onChange={change} className="imlaa-input mt-2 min-h-11" placeholder="https://github.com/username" />
        </label>
        <label className="text-sm font-semibold text-body-dark">
          Portfolio (optional)
          <input name="portfolioUrl" type="url" value={form.portfolioUrl} onChange={change} className="imlaa-input mt-2 min-h-11" placeholder="https://" />
        </label>
      </div>
      <label className="block text-sm font-semibold text-body-dark">
        Short bio
        <textarea name="bio" value={form.bio} onChange={change} maxLength={1600} rows={4} className="imlaa-input mt-2 resize-y" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-body-dark">
        <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={change} className="mt-1 h-4 w-4 accent-plum" />
        <span>Opt in to the public developer directory. I understand the fields above may be displayed after approval.</span>
      </label>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <button type="submit" disabled={busy} className="imlaa-btn-primary min-h-11 px-5 font-bold disabled:opacity-50">
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function ProposalCard({ proposal, incoming, onRespond }) {
  const [busy, setBusy] = useState(false);
  const respond = async (status) => {
    setBusy(true);
    try {
      await onRespond(proposal.id, status);
    } catch {
      // The parent displays the returned service error beside the workspace controls.
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="space-y-3 rounded-xl border border-plum-border/35 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-body-dark">{incoming ? "Project proposal received" : "Project proposal sent"}</h3>
        <span className="rounded-full bg-plum/10 px-3 py-1 text-xs font-bold capitalize text-plum">{proposal.status}</span>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-label">{proposal.project_description}</p>
      <p className="text-sm"><strong>Deliverables:</strong> <span className="text-muted-label">{proposal.deliverables}</span></p>
      {proposal.desired_skills && <p className="text-sm"><strong>Skills:</strong> <span className="text-muted-label">{proposal.desired_skills}</span></p>}
      {proposal.timeline && <p className="text-sm"><strong>Timeline:</strong> <span className="text-muted-label">{proposal.timeline}</span></p>}
      {proposal.budget_range && <p className="text-sm"><strong>Budget:</strong> <span className="text-muted-label">{proposal.budget_range}</span></p>}
      <p className="break-all text-sm"><strong>Contact:</strong> <span className="text-muted-label">{proposal.contact_email}</span></p>
      {proposal.status === "sent" && (
        <div className="flex flex-wrap gap-2 pt-2">
          {incoming ? (
            <>
              <button type="button" disabled={busy} onClick={() => respond("accepted")} className="imlaa-btn-primary min-h-11 px-4 text-sm font-bold disabled:opacity-50">Accept</button>
              <button type="button" disabled={busy} onClick={() => respond("declined")} className="imlaa-btn-secondary min-h-11 px-4 text-sm disabled:opacity-50">Decline</button>
            </>
          ) : (
            <button type="button" disabled={busy} onClick={() => respond("withdrawn")} className="imlaa-btn-secondary min-h-11 px-4 text-sm disabled:opacity-50">Withdraw proposal</button>
          )}
        </div>
      )}
    </article>
  );
}

export default function DeveloperWorkspacePage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setError("");
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setWorkspace(await getDeveloperWorkspace(userId));
    } catch (loadError) {
      console.error("Could not load developer workspace:", loadError);
      setError(loadError.message || "Your developer workspace could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleRespond = async (proposalId, status) => {
    try {
      await respondToHireProposal(proposalId, status);
      showSuccessToast("Proposal updated", `The proposal is now ${status}.`);
      await loadWorkspace(true);
    } catch (respondError) {
      console.error("Could not update proposal:", respondError);
      setError(respondError.message || "The proposal could not be updated.");
      throw respondError;
    }
  };

  const applications = workspace?.applications || [];
  const latestApplication = applications[0];
  const canApply = !latestApplication || ["rejected", "withdrawn"].includes(latestApplication.status);
  const canManageProfile = latestApplication?.status === "approved";

  if (loading) {
    return <div role="status" className="rounded-xl border border-plum-border/35 bg-white p-10 text-center text-muted-label shadow-sm">Loading developer workspace…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      <header className="flex flex-col gap-5 rounded-xl border border-plum-border/40 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-plum">Private workspace</p>
          <h1 className="mt-1 text-3xl font-black text-body-dark">Developer collaboration</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-label">Track your application, manage an optional public profile, and respond to private project proposals.</p>
        </div>
        <button type="button" onClick={() => loadWorkspace(true)} disabled={refreshing} className="imlaa-btn-secondary inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-50">
          <HiArrowPath className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />Refresh
        </button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <HiUserGroup className="h-6 w-6 text-plum" aria-hidden="true" />
          <h2 className="text-xl font-black text-body-dark">Application</h2>
        </div>
        {latestApplication && (
          <article className="space-y-3 rounded-xl border border-plum-border/35 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-body-dark">{latestApplication.display_name}</h3>
              <span className="rounded-full bg-plum/10 px-3 py-1 text-xs font-bold text-plum">{STATUS_LABELS[latestApplication.status] || latestApplication.status}</span>
            </div>
            <p className="text-sm text-muted-label">Submitted {new Date(latestApplication.created_at).toLocaleDateString()}</p>
            {latestApplication.reviewer_notes && <p className="rounded-lg bg-plum/5 p-3 text-sm text-body-dark"><strong>Reviewer note:</strong> {latestApplication.reviewer_notes}</p>}
            {["pending", "under_review"].includes(latestApplication.status) && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await withdrawDeveloperApplication(latestApplication.id);
                    showSuccessToast("Application withdrawn");
                    await loadWorkspace(true);
                  } catch (withdrawError) {
                    console.error("Could not withdraw developer application:", withdrawError);
                    setError(withdrawError.message || "The application could not be withdrawn.");
                  }
                }}
                className="imlaa-btn-secondary min-h-11 px-4 text-sm"
              >
                Withdraw application
              </button>
            )}
          </article>
        )}
        {canApply && (
          <div className="rounded-xl border border-dashed border-plum-border/60 bg-white p-5">
            <p className="text-sm text-muted-label">
              {latestApplication
                ? "You may submit a new application when you are ready."
                : "You have not submitted a developer application yet."}
            </p>
            <Link to="/workspace/developer/application" className="imlaa-btn-primary mt-3 inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold">
              Open application form
            </Link>
          </div>
        )}
      </section>

      {canManageProfile && (
        <section>
          <DeveloperProfileForm
            key={workspace?.profile?.updated_at || "new"}
            userId={userId}
            profile={workspace?.profile}
            onSaved={() => loadWorkspace(true)}
          />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <HiBriefcase className="h-6 w-6 text-plum" aria-hidden="true" />
          <h2 className="text-xl font-black text-body-dark">Project proposals</h2>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-body-dark">Received</h3>
            {workspace?.receivedProposals?.length ? workspace.receivedProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} incoming onRespond={handleRespond} />
            )            ) : <p className="rounded-xl border border-dashed border-plum-border/60 bg-white p-5 text-sm text-muted-label">No proposals yet.</p>}
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-body-dark">Sent</h3>
            {workspace?.sentProposals?.length ? workspace.sentProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} incoming={false} onRespond={handleRespond} />
            )            ) : <p className="rounded-xl border border-dashed border-plum-border/60 bg-white p-5 text-sm text-muted-label">You have not sent any proposals.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

export function DeveloperApplicationPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 py-3">
      <Link to="/workspace/community?tab=developer" className="imlaa-btn-secondary inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold">
        <HiArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to community
      </Link>
      <DeveloperApplicationForm onSubmitted={() => navigate("/workspace/community?tab=developer", { replace: true })} />
    </div>
  );
}
