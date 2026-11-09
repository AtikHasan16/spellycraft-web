import { useEffect, useState } from "react";
import { HiArrowTopRightOnSquare, HiArrowPath, HiCommandLine } from "react-icons/hi2";

const REPOSITORIES = [
  { owner: "AtikHasan16", name: "spellycraft-web" },
  { owner: "AtikHasan16", name: "spellycraft-server" },
];
const CACHE_MAX_AGE_MS = 15 * 60 * 1000;

function readCache(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "null");
    return stored && Array.isArray(stored.commits) ? stored : null;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Could not cache public GitHub activity:", error);
  }
}

async function fetchRepositoryCommits(repository) {
  const key = `spellycraft.github.${repository.name}`;
  const cache = readCache(key);
  const isFresh = cache && Date.now() - cache.fetchedAt < CACHE_MAX_AGE_MS;
  if (isFresh) return { repository, commits: cache.commits, cached: true };

  const headers = { Accept: "application/vnd.github+json" };
  if (cache?.etag) headers["If-None-Match"] = cache.etag;
  const response = await fetch(
    `https://api.github.com/repos/${repository.owner}/${repository.name}/commits?per_page=5`,
    { headers },
  );

  if (response.status === 304 && cache) {
    const updated = { ...cache, fetchedAt: Date.now() };
    writeCache(key, updated);
    return { repository, commits: updated.commits, cached: true };
  }
  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub activity is temporarily rate-limited.");
  }
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${repository.name}.`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error(`Invalid commit feed for ${repository.name}.`);
  const commits = payload
    .map((item) => {
      const commitUrl = new URL(item.html_url || "");
      if (
        commitUrl.protocol !== "https:" ||
        commitUrl.hostname !== "github.com" ||
        commitUrl.pathname.split("/")[1] !== repository.owner ||
        commitUrl.pathname.split("/")[2] !== repository.name
      ) {
        return null;
      }
      return {
        sha: String(item.sha || "").slice(0, 12),
        message: String(item.commit?.message || "").split("\n")[0].slice(0, 200),
        author: String(item.author?.login || item.commit?.author?.name || "Contributor").slice(0, 100),
        date: item.commit?.author?.date || null,
        url: commitUrl.href,
      };
    })
    .filter(Boolean);

  const value = {
    commits,
    etag: response.headers.get("etag"),
    fetchedAt: Date.now(),
  };
  writeCache(key, value);
  return { repository, commits, cached: false };
}

export async function loadRecentCommunityActivity() {
  const results = await Promise.allSettled(REPOSITORIES.map(fetchRepositoryCommits));
  return {
    feeds: results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value),
    hasFailures: results.some((result) => result.status === "rejected"),
  };
}

export default function GitHubActivity() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    const { feeds: successful, hasFailures } = await loadRecentCommunityActivity();
    setFeeds(successful);
    if (hasFailures) {
      console.warn("Some GitHub feeds could not be loaded.");
      setError("Some GitHub activity is temporarily unavailable. Please try again later.");
    }
    if (!successful.length && !hasFailures) {
      setError("No recent public commits were found.");
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-plum-border/35 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <HiCommandLine className="h-8 w-8 shrink-0 text-plum" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-plum">Open development</p>
            <h2 className="mt-1 text-xl font-black text-body-dark sm:text-2xl">Live repository feed</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-label">
              Recent commits from SpellyCraft’s public repositories. This read-only feed may be delayed or rate-limited by GitHub.
            </p>
          </div>
        </div>
        <button type="button" onClick={refresh} disabled={loading} className="imlaa-btn-secondary inline-flex min-h-11 shrink-0 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-50">
          <HiArrowPath className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {loading && !feeds.length && <p role="status" className="imlaa-card p-6 text-center text-muted-label">Loading public GitHub activity…</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        {feeds.map(({ repository, commits, cached }) => (
          <section key={repository.name} className="rounded-xl border border-plum-border/35 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-plum-border/30 pb-3">
              <div>
                <h3 className="text-base font-bold text-body-dark">{repository.name}</h3>
                <p className="mt-1 text-xs text-muted-label">Recent public commits</p>
              </div>
              <a
                href={`https://github.com/${repository.owner}/${repository.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-plum/5 px-3 text-sm font-semibold text-plum transition hover:bg-plum/10"
              >
                View repository <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-3 text-xs text-muted-label">
              {repository.owner}/{repository.name} · {cached ? "Cached response" : "Fetched from GitHub"}
            </p>
            {commits.length ? (
              <ul className="mt-3 space-y-2">
                {commits.map((commit) => (
                  <li key={commit.sha} className="rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100">
                    <a href={commit.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex min-w-0 items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plum text-[11px] font-black text-white">
                          {commit.author.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block break-words font-semibold leading-snug text-body-dark group-hover:text-plum">{commit.message || "Commit"}</span>
                          <span className="mt-1 block text-xs text-muted-label">
                            {commit.author} · {commit.date ? new Date(commit.date).toLocaleDateString() : "Date unavailable"}
                          </span>
                        </span>
                      </span>
                      <span className="inline-flex min-h-10 shrink-0 items-center gap-1 self-end rounded-lg bg-white px-3 text-sm font-semibold text-plum sm:self-auto">
                        <code className="font-mono">{commit.sha.slice(0, 7)}</code>
                        <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-muted-label">No recent commits in this repository.</p>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
