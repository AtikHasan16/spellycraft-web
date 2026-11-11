/**
 * Spelling session summary (src/components/spelling/SpellingSessionSummary.jsx)
 * Final tally plus corpus mastery and retry actions.
 */
import { HiSparkles } from "react-icons/hi2";

export default function SpellingSessionSummary({
  selectedGroup,
  sessionCorrect,
  sessionMisspelled,
  corpusMastery,
  mistakeCount,
  onPracticeMistakes,
  onStartOver,
  onReturnToSets,
}) {
  return (
    <div className="w-full max-w-xl mx-auto imlaa-card p-8 sm:p-10 text-center space-y-7 animate-slide-up border border-plum/20 shadow-lg bg-white">
      <div className="w-16 h-16 rounded-full bg-plum/10 text-plum mx-auto flex items-center justify-center">
        <HiSparkles className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-body-dark">
          Spelling Session Complete!
        </h2>
        <p className="text-base text-muted-label">
          Detailed transcription breakdown for {selectedGroup?.title}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="text-4xl font-black text-emerald-700">
            {sessionCorrect.length}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mt-1">
            Correctly Spelled
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <div className="text-4xl font-black text-rose-700">
            {sessionMisspelled.length}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-rose-800 mt-1">
            Misspelled
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-plum/15 bg-stone-50 p-5 text-left">
        <h3 className="text-base font-black text-body-dark">Corpus Mastery</h3>
        <p className="mt-1 text-sm text-muted-label">
          Saved in this browser; the latest result determines each word&apos;s category.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 p-3">
            <div className="text-2xl font-black text-emerald-700">
              {corpusMastery.know}
            </div>
            <div className="text-xs font-bold text-emerald-800">Know</div>
          </div>
          <div className="rounded-xl bg-rose-50 p-3">
            <div className="text-2xl font-black text-rose-700">
              {corpusMastery.doNotKnow}
            </div>
            <div className="text-xs font-bold text-rose-800">Do Not Know</div>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <div className="text-2xl font-black text-amber-700">
              {corpusMastery.forgot}
            </div>
            <div className="text-xs font-bold text-amber-800">Forgot</div>
          </div>
        </div>
      </section>

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
