/**
 * Flashcard session summary (src/components/flashcards/FlashcardSessionSummary.jsx)
 * Post-drill tally with retry, mistake-review, and return actions.
 */
import { HiSparkles } from "react-icons/hi2";

export default function FlashcardSessionSummary({
  selectedGroup,
  sessionKnew,
  sessionUnknown,
  sessionForgot,
  onPracticeMistakes,
  onStartOver,
  onReturnToSets,
}) {
  const mistakeCount = sessionUnknown.length + sessionForgot.length;

  return (
    <div className="w-full max-w-xl mx-auto imlaa-card p-8 sm:p-10 text-center space-y-7 animate-slide-up border border-plum/20 shadow-lg bg-white">
      <div className="w-16 h-16 rounded-full bg-plum/10 text-plum mx-auto flex items-center justify-center">
        <HiSparkles className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-body-dark">
          Flashcard Session Complete!
        </h2>
        <p className="text-base text-muted-label">
          Here is your active recall breakdown for {selectedGroup?.title}.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="text-3xl font-black text-emerald-700">{sessionKnew.length}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mt-1">
            Knew It
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <div className="text-3xl font-black text-rose-700">{sessionUnknown.length}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-rose-800 mt-1">
            Didn't Know
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="text-3xl font-black text-amber-700">{sessionForgot.length}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mt-1">
            Forgot
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-plum/15">
        {mistakeCount > 0 && (
          <button
            type="button"
            onClick={onPracticeMistakes}
            className="imlaa-btn-primary w-full sm:w-auto py-3 px-6 text-base font-bold bg-rose-600 hover:bg-rose-700 text-white"
          >
            Practice Mistakes ({mistakeCount})
          </button>
        )}

        <button
          type="button"
          onClick={onStartOver}
          className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base font-semibold"
        >
          Start Over
        </button>

        <button
          type="button"
          onClick={onReturnToSets}
          className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base font-semibold"
        >
          Corpus Sets
        </button>
      </div>
    </div>
  );
}
