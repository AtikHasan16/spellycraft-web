import { useEffect, useMemo, useState } from "react";
import { HiAcademicCap, HiArrowTopRightOnSquare, HiChevronLeft, HiChevronRight, HiCloudArrowUp, HiMagnifyingGlass, HiUser } from "react-icons/hi2";
import { SearchEmptyState } from "../EmptyState";
import { SkeletonCorpusGrid } from "../Skeletons";

const PAGE_SIZE = 3;

export default function CorpusDirectory({ corpusList, loading, onUpload, userName }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredCorpus = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return corpusList;
    return corpusList.filter((item) =>
      item.title.toLocaleLowerCase().includes(query) ||
      item.category.toLocaleLowerCase().includes(query) ||
      (item.uploaderName && item.uploaderName.toLocaleLowerCase().includes(query)),
    );
  }, [corpusList, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCorpus.length / PAGE_SIZE));
  const visibleCorpus = filteredCorpus.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <section className="imlaa-card space-y-6 p-6 sm:p-8">
      <header className="flex flex-col gap-3 border-b border-plum/15 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-body-dark sm:text-2xl">
              Corpus Sets Progress Directory
            </h2>
            <span className="imlaa-badge text-xs">{corpusList.length} Sets</span>
          </div>
          <p className="mt-1 text-xs text-muted-label sm:text-sm">
            Detailed breakdown of your curriculum and custom uploaded corpus sets.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative">
            <span className="sr-only">Search corpus topics</span>
            <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-label" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search topics..."
              className="imlaa-input min-h-11 w-full rounded-xl pl-9 pr-3 text-xs sm:w-56 sm:text-sm"
            />
          </label>
          <button
            type="button"
            onClick={onUpload}
            className="imlaa-btn-secondary min-h-11 shrink-0 space-x-1.5 px-3 text-xs font-semibold sm:text-sm"
          >
            <HiCloudArrowUp className="h-4 w-4 text-plum" />
            <span>Upload New</span>
          </button>
        </div>
      </header>

      {loading ? (
        <SkeletonCorpusGrid count={PAGE_SIZE} />
      ) : filteredCorpus.length === 0 ? (
        searchQuery ? (
          <SearchEmptyState searchTerm={searchQuery} onReset={() => setSearchQuery("")} />
        ) : (
          <div className="py-12 text-center text-muted-label">
            No corpus sets found. Upload a vocabulary set to get started!
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleCorpus.map((item) => (
              <article
                key={`${item.category}:${item.title}`}
                className="flex flex-col justify-between space-y-4 rounded-xl border border-plum/20 bg-plum/5 p-5 transition hover:shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-label">
                      {item.category}
                    </span>
                    {item.status === "completed" ? (
                      <span className="rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        Completed
                      </span>
                    ) : item.status === "in-progress" ? (
                      <span className="rounded-md border border-plum/20 bg-plum/10 px-2 py-0.5 text-[11px] font-bold text-plum">
                        In Progress
                      </span>
                    ) : (
                      <span className="rounded-md border border-stone-300 bg-stone-200/80 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                        Not Started
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold leading-snug text-body-dark sm:text-lg">
                    {item.title}
                  </h3>

                  {item.category === "Uploaded" ? (
                    <div className="inline-flex items-center space-x-1.5 rounded-md border border-plum/15 bg-white px-2 py-0.5 text-xs font-semibold text-plum">
                      <HiUser className="h-3.5 w-3.5 text-plum" />
                      <span>Uploaded by {item.uploaderName || userName || "You"}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-1.5 rounded-md border border-stone-200 bg-white px-2 py-0.5 text-xs font-semibold text-stone-700">
                      <HiAcademicCap className="h-3.5 w-3.5 text-plum" />
                      <span>Curriculum Corpus</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-plum/10 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-label">
                    <span>Progress ({item.masteredCount} / {item.wordsCount} words)</span>
                    <span className="font-bold text-body-dark">{item.percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-plum/15">
                    <div
                      className="h-full rounded-full bg-plum transition-all duration-500"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {item.mistakesCount > 0 ? (
                      <span className="text-xs font-bold text-rose-600">{item.mistakesCount} Needs Review</span>
                    ) : (
                      <span className="text-xs text-muted-label">{item.wordsCount} Total terms</span>
                    )}
                    <button
                      type="button"
                      onClick={() => onUpload("study")}
                      className="imlaa-btn-secondary space-x-1 px-3 py-1.5 text-xs font-bold text-plum active:scale-95"
                    >
                      <span>Study</span>
                      <HiArrowTopRightOnSquare className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Corpus directory pages"
              className="flex flex-col items-center justify-between gap-3 border-t border-plum/10 pt-4 sm:flex-row"
            >
              <span aria-live="polite" className="text-sm text-muted-label">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredCorpus.length)} of {filteredCorpus.length} sets
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous corpus sets"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="imlaa-btn-secondary inline-flex min-h-11 min-w-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <HiChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-24 text-center text-sm font-semibold text-body-dark">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Next corpus sets"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                  className="imlaa-btn-secondary inline-flex min-h-11 min-w-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <HiChevronRight className="h-5 w-5" />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
