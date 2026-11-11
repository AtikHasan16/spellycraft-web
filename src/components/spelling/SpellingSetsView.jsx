/**
 * Spelling corpus browser (src/components/spelling/SpellingSetsView.jsx)
 * Renders part tabs, the mistakes grid, paginated corpus cards, and paging.
 */
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import SpellingGroupCard from "./SpellingGroupCard";
import SpellingMistakeCard from "./SpellingMistakeCard";

export default function SpellingSetsView({
  parts,
  activePart,
  onPartChange,
  groups,
  mistakes,
  totalPages,
  currentPage,
  onPrevPage,
  onNextPage,
  userName,
  meaningLanguageCode,
  meaningLanguageLabel,
  onStartDrill,
  onStartQuiz,
  onPracticeMistakes,
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {parts.map((part) => (
          <button
            key={part}
            type="button"
            onClick={() => onPartChange(part)}
            className={`imlaa-tab-btn text-base px-5 py-2.5 min-h-11 ${
              activePart === part ? "active" : ""
            }`}
          >
            {part === "Mistakes" ? `Mistakes (${mistakes.length})` : part}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activePart === "Mistakes" ? (
          mistakes.length === 0 ? (
            <p className="imlaa-card md:col-span-2 lg:col-span-3 p-6 text-center text-muted-label">
              No spelling mistakes to review. Words you spell correctly will leave this list.
            </p>
          ) : (
            mistakes.map((entry) => (
              <SpellingMistakeCard
                key={`${entry.topic}:${entry.word.word.toLocaleLowerCase()}`}
                entry={entry}
                meaningLanguageCode={meaningLanguageCode}
                meaningLanguageLabel={meaningLanguageLabel}
                onPractice={onPracticeMistakes}
              />
            ))
          )
        ) : groups.length === 0 ? (
          <p className="imlaa-card md:col-span-2 lg:col-span-3 p-6 text-center text-muted-label">
            No vocabulary sets are available in this tab yet.
          </p>
        ) : (
          groups.map((group) => (
            <SpellingGroupCard
              key={group.id}
              group={group}
              userName={userName}
              onStartDrill={onStartDrill}
              onStartQuiz={onStartQuiz}
              onPracticeMistakes={onPracticeMistakes}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage === 0}
            className="imlaa-btn-secondary min-h-11 min-w-11 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-body-dark px-4">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage === totalPages - 1}
            className="imlaa-btn-secondary min-h-11 min-w-11 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
