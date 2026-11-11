/**
 * Spelling mistake card (src/components/spelling/SpellingMistakeCard.jsx)
 * Shows one unresolved misspelling with its meaning and a drill shortcut.
 */
import { getVocabularyMeaning } from "../../utils/meaningLanguages";

export default function SpellingMistakeCard({
  entry,
  meaningLanguageCode,
  meaningLanguageLabel,
  onPractice,
}) {
  const missedAttempts =
    (entry.attempts?.doNotKnow || 0) + (entry.attempts?.forgot || 0);

  return (
    <div className="imlaa-card p-6 flex flex-col justify-between border border-rose-200">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wide text-rose-700">
            {entry.status === "forgot" ? "Forgot" : "Do Not Know"}
          </span>
          <span className="text-xs text-muted-label">{missedAttempts} missed attempts</span>
        </div>
        <h3 className="text-xl font-bold text-body-dark">
          Correct spelling: {entry.word.word}
        </h3>
        <p className="text-sm text-muted-label mt-1">{entry.topic}</p>
        <p className="text-sm text-muted-label mt-3">
          {meaningLanguageLabel} meaning:{" "}
          {getVocabularyMeaning(entry.word, meaningLanguageCode) ||
            `No ${meaningLanguageLabel} meaning saved yet.`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onPractice(entry.group)}
        className="imlaa-btn-secondary mt-4 py-2.5 px-4 text-rose-700 font-bold min-h-11"
      >
        Practice this corpus
      </button>
    </div>
  );
}
