import { useEffect, useMemo, useState } from "react";
import {
  HiArrowTopRightOnSquare,
  HiCheckCircle,
  HiCommandLine,
  HiLightBulb,
  HiClipboardDocumentList,
  HiUserGroup,
} from "react-icons/hi2";
import { getCommunityStats } from "../../services/communityService";
import { loadRecentCommunityActivity } from "./GitHubActivity";

const EMPTY_METRICS = {
  developers: "—",
  publicDevelopers: "—",
  requests: "—",
  featureRequests: "—",
  problemReports: "—",
  underReview: "—",
  resolvedProblems: "—",
  contributors: "—",
};

function MetricCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="flex min-h-32 flex-col justify-between rounded-xl border border-plum-border/40 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-label">{label}</p>
        <Icon className="h-5 w-5 shrink-0 text-plum" aria-hidden="true" />
      </div>
      <div>
        <p className="text-3xl font-black tabular-nums text-body-dark">{value}</p>
        <p className="mt-1 text-xs text-muted-label">{detail}</p>
      </div>
    </article>
  );
}

export default function CommunityOverview() {
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState("");
  const [feeds, setFeeds] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    let active = true;
    getCommunityStats()
      .then((stats) => {
        if (active) setMetrics(stats);
      })
      .catch((error) => {
        console.error("Could not load community statistics:", error);
        if (active) setMetricsError("Community statistics are temporarily unavailable.");
      })
      .finally(() => {
        if (active) setMetricsLoading(false);
      });

    loadRecentCommunityActivity()
      .then(({ feeds: recentFeeds, hasFailures }) => {
        if (!active) return;
        setFeeds(recentFeeds);
        if (hasFailures) setActivityError("Some recent repository activity is temporarily unavailable.");
      })
      .catch((error) => {
        console.error("Could not load recent community commits:", error);
        if (active) setActivityError("Recent repository activity is temporarily unavailable.");
      })
      .finally(() => {
        if (active) setActivityLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const recentCommits = useMemo(
    () => feeds
      .flatMap(({ repository, commits }) => commits.map((commit) => ({ ...commit, repository })))
      .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
      .slice(0, 3),
    [feeds],
  );
  const commitCount = activityLoading
    ? "…"
    : recentCommits.length || (activityError ? "—" : 0);

  return (
    <div className="space-y-5" aria-label="Community overview dashboard">
      {metricsError && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{metricsError}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Approved developers"
          value={metricsLoading ? "…" : metrics.developers}
          detail={`${metricsLoading ? "…" : metrics.publicDevelopers} public profiles`}
          icon={HiUserGroup}
        />
        <MetricCard
          label="Requests received"
          value={metricsLoading ? "…" : metrics.requests}
          detail="Feature ideas and problem reports"
          icon={HiLightBulb}
        />
        <MetricCard
          label="Feature requests"
          value={metricsLoading ? "…" : metrics.featureRequests}
          detail="Ideas submitted by the community"
          icon={HiLightBulb}
        />
        <MetricCard
          label="Problem reports"
          value={metricsLoading ? "…" : metrics.problemReports}
          detail="Issues submitted for review"
          icon={HiClipboardDocumentList}
        />
        <MetricCard
          label="In progress / under review"
          value={metricsLoading ? "…" : metrics.underReview}
          detail="Requests awaiting action or being worked on"
          icon={HiClipboardDocumentList}
        />
        <MetricCard
          label="Problems resolved"
          value={metricsLoading ? "…" : metrics.resolvedProblems}
          detail="Problem reports marked resolved"
          icon={HiCheckCircle}
        />
        <MetricCard
          label="Verified contributors"
          value={metricsLoading ? "…" : metrics.contributors}
          detail="Public recognition with confirmed consent"
          icon={HiUserGroup}
        />
        <MetricCard
          label="Recent commits shown"
          value={commitCount}
          detail="Latest updates in the list below"
          icon={HiCommandLine}
        />
      </div>

      <section className="rounded-xl border border-plum-border/40 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="recent-commits-heading">
        <div className="flex items-center gap-3 border-b border-plum-border/30 pb-3">
          <HiCommandLine className="h-6 w-6 text-plum" aria-hidden="true" />
          <div>
            <h3 id="recent-commits-heading" className="text-lg font-bold text-body-dark">Recent commit messages</h3>
            <p className="mt-1 text-sm text-muted-label">The latest three public updates from SpellyCraft repositories.</p>
          </div>
        </div>
        {activityError && <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{activityError}</p>}
        {activityLoading ? (
          <p role="status" className="py-6 text-center text-sm text-muted-label">Loading recent commits…</p>
        ) : recentCommits.length ? (
          <ul className="mt-2 divide-y divide-plum-border/25">
            {recentCommits.map((commit) => (
              <li key={`${commit.repository.name}-${commit.sha}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <a href={commit.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 break-words font-semibold text-body-dark underline decoration-plum/40 underline-offset-2 hover:text-plum">
                    {commit.message || "Commit"}
                    <HiArrowTopRightOnSquare className="h-4 w-4 shrink-0 text-plum" aria-hidden="true" />
                  </a>
                  <p className="mt-1 text-xs text-muted-label">
                    {commit.repository.name} · {commit.author} · {commit.date ? new Date(commit.date).toLocaleDateString() : "Date unavailable"}
                  </p>
                </div>
                <code className="text-xs text-muted-label">{commit.sha.slice(0, 7)}</code>
              </li>
            ))}
          </ul>
        ) : !activityError ? (
          <p className="py-6 text-center text-sm text-muted-label">No recent commits were found.</p>
        ) : null}
      </section>
    </div>
  );
}
