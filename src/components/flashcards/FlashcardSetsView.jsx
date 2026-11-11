/**
 * Flashcard corpus browser (src/components/flashcards/FlashcardSetsView.jsx)
 * Renders the part filter tabs, paginated corpus cards, and pagination.
 * Fetching and drill transitions are delegated to the parent page.
 */
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import FlashcardGroupCard from "./FlashcardGroupCard";

export default function FlashcardSetsView({
  parts,
  activePart,
  onPartChange,
  groups,
  totalPages,
  currentPage,
  onPrevPage,
  onNextPage,
  masteryRecords,
  userName,
  isAdmin,
  onStartDrill,
  onStartQuiz,
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {parts.map((part) => (
          <button
            key={part}
            type="button"
            onClick={() => onPartChange(part)}
            className={`imlaa-tab-btn text-base px-5 py-2.5 ${
              activePart === part ? "active" : ""
            }`}
          >
            {part}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 ? (
          <p className="imlaa-card md:col-span-2 lg:col-span-3 p-6 text-center text-muted-label">
            {activePart === "Mistakes"
              ? "No words need review right now. Incorrect and forgotten answers will appear here."
              : "No vocabulary sets are available in this tab yet."}
          </p>
        ) : (
          groups.map((group) => (
            <FlashcardGroupCard
              key={group.id}
              group={group}
              masteryRecords={masteryRecords}
              userName={userName}
              isAdmin={isAdmin}
              onStartDrill={onStartDrill}
              onStartQuiz={onStartQuiz}
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
