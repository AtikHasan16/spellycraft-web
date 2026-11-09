import { useEffect, useState } from "react";
import { HiArrowTopRightOnSquare, HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import {
  RESOURCE_CATEGORIES,
  listResources,
} from "../../services/resourceService";

const PAGE_SIZE = 9;

function ResourceCard({ resource }) {
  return (
    <article className="imlaa-card flex h-full flex-col border border-plum/15 p-5 transition hover:-translate-y-0.5 hover:border-plum/35 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full border border-plum/15 bg-plum/5 px-3 py-1 text-xs font-bold text-plum">
          {resource.category}
        </span>
        <span className="text-xs font-medium text-muted-label">Free resource</span>
      </div>
      <h2 className="mt-4 text-xl font-bold leading-snug text-body-dark">
        {resource.title}
      </h2>
      <p className="mt-3 flex-1 whitespace-pre-line leading-relaxed text-muted-label">
        {resource.short_description}
      </p>
      <a
        href={resource.drive_url}
        target="_blank"
        rel="noopener noreferrer"
        className="imlaa-btn-primary mt-6 inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold"
        aria-label={`Preview ${resource.title} in Google Drive (opens in a new tab)`}
      >
        Preview in Drive
        <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden="true" />
      </a>
      <p className="mt-2 text-center text-xs text-muted-label">
        Use Google Drive’s download option if you want a copy.
      </p>
    </article>
  );
}

export default function ResourceDirectory({ visibility }) {
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [resources, setResources] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    listResources({ visibility, category, page, pageSize: PAGE_SIZE })
      .then(({ data, count }) => {
        if (!active) return;
        setResources(data);
        setTotal(count);
      })
      .catch((requestError) => {
        if (!active) return;
        console.error(`Failed to load ${visibility} resources:`, requestError);
        setResources([]);
        setTotal(0);
        setError("Resources could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visibility, category, page]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-2 text-sm font-semibold text-body-dark sm:flex-row sm:items-center">
          Filter by category
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="imlaa-input min-h-11 min-w-48"
            aria-label="Filter resources by category"
          >
            <option value="all">All categories</option>
            {RESOURCE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted-label" aria-live="polite">
          {total} {total === 1 ? "resource" : "resources"}
        </p>
      </div>

      {loading ? (
        <div className="imlaa-card p-10 text-center text-muted-label" role="status">
          Loading resources…
        </div>
      ) : error ? (
        <div className="imlaa-card border border-rose-200 bg-rose-50 p-6 text-center text-rose-800" role="alert">
          {error}
        </div>
      ) : resources.length === 0 ? (
        <div className="imlaa-card border border-dashed border-plum/25 bg-plum/5 px-6 py-12 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-plum">
            Coming soon
          </p>
          <h2 className="mt-3 text-2xl font-black text-body-dark">
            New study resources are being prepared.
          </h2>
          <p className="mx-auto mt-2 max-w-xl leading-relaxed text-muted-label">
            There are no resources in this category yet. Please check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard key={`${visibility}-${resource.id}`} resource={resource} />
          ))}
        </div>
      )}

      {!loading && !error && total > PAGE_SIZE && (
        <nav
          className="flex items-center justify-center gap-3 pt-2"
          aria-label="Resource pages"
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="imlaa-btn-secondary inline-flex min-h-11 items-center gap-1 px-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </button>
          <span className="text-sm font-semibold text-body-dark" aria-live="polite">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
            className="imlaa-btn-secondary inline-flex min-h-11 items-center gap-1 px-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <HiChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
