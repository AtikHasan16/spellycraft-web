/**
 * Flashcard page header (src/components/flashcards/FlashcardHeader.jsx)
 * Title, lexeme count badge, and the global "Random Quiz" action.
 */
import { HiSparkles } from "react-icons/hi2";

export default function FlashcardHeader({ totalCount, loading, onStartQuiz }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-plum/15">
      <div>
        <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
          <h1 className="text-2xl sm:text-3xl font-black text-body-dark tracking-tight">
            Vocabulary Flashcards
          </h1>
          <span className="imlaa-badge text-xs sm:text-base py-0.5 sm:py-1 px-2.5 sm:px-3">
            {totalCount ?? 0} Lexemes
          </span>
        </div>
        <p className="text-xs sm:text-base text-muted-label mt-1">
          Active recall, confidence self-assessment & targeted mistake drill.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onStartQuiz()}
        disabled={loading}
        className="imlaa-btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-4 flex items-center space-x-2 min-h-11 self-start sm:self-auto"
      >
        <HiSparkles className="w-4 h-4 text-plum shrink-0" />
        <span>Random Quiz</span>
      </button>
    </div>
  );
}
