/**
 * Spelling corpus card (src/components/spelling/SpellingGroupCard.jsx)
 * Presentational card for one spelling corpus with mastery and actions.
 */
import { HiAcademicCap, HiUser } from "react-icons/hi2";

export default function SpellingGroupCard({
  group,
  userName,
  onStartDrill,
  onStartQuiz,
  onPracticeMistakes,
}) {
  return (
    <div className="imlaa-card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 border border-plum/20">
      <div>
        <div className="flex items-center justify-between text-base font-semibold mb-2">
          <span className="text-muted-label font-semibold">{group.wordsCount} Terms</span>
          {group.hasMistakes && (
            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs font-bold">
              {group.incorrectCount} Misspelled
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-body-dark leading-snug mb-1">
          {group.title}
        </h3>

        <div className="mb-3">
          {group.part === "Uploaded" ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-plum/10 text-plum text-xs font-semibold border border-plum/20">
              <HiUser className="w-3.5 h-3.5 text-plum" />
              <span>Uploaded by {group.uploaderName || userName || "You"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200">
              <HiAcademicCap className="w-3.5 h-3.5 text-plum" />
              <span>Curriculum Corpus</span>
            </span>
          )}
        </div>

        <p className="text-base text-muted-label leading-relaxed mb-4">
          {group.description}
        </p>
      </div>

      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-label mb-1.5">
            <span>Spelling Accuracy</span>
            <span>{group.percent}%</span>
          </div>
          <div className="w-full bg-plum/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-plum transition-all duration-500"
              style={{ width: `${group.percent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-plum/10 gap-2">
          {group.hasMistakes ? (
            <button
              type="button"
              onClick={() => onPracticeMistakes(group)}
              className="imlaa-btn-secondary text-xs py-2 px-3 text-rose-700 font-bold border-rose-300"
            >
              Mistakes ({group.incorrectCount})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStartQuiz(group)}
              className="imlaa-btn-secondary text-xs py-2 px-3 text-plum"
            >
              Quiz
            </button>
          )}

          <button
            type="button"
            disabled={!group.wordsCount}
            onClick={() => onStartDrill(group, false)}
            className="imlaa-btn-primary py-2 px-4 text-sm font-semibold"
          >
            Start Spelling
          </button>
        </div>
      </div>
    </div>
  );
}
