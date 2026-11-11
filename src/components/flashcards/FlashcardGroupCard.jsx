/**
 * Flashcard corpus card (src/components/flashcards/FlashcardGroupCard.jsx)
 * Presentational card for one vocabulary set. All data arrives via props;
 * this component owns no fetching or persistence.
 */
import {
  HiAcademicCap,
  HiUser,
  HiXCircle,
} from "react-icons/hi2";
import { getFlashcardMasterySummary } from "../../utils/flashcardMastery";

export default function FlashcardGroupCard({
  group,
  masteryRecords,
  userName,
  isAdmin,
  onStartDrill,
  onStartQuiz,
}) {
  const summary = getFlashcardMasterySummary(masteryRecords, group.title);
  const uploader = group.uploaderName || userName || (isAdmin ? "Admin" : "You");

  return (
    <div className="imlaa-card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 border border-plum/20">
      <div>
        <div className="flex items-center justify-between text-base font-semibold mb-2">
          <span className="text-muted-label font-semibold">
            {group.wordsCount} Terms
          </span>
          {group.hasMistakes && (
            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs font-bold">
              {group.mistakesCount} Needs Review
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
              <span>Uploaded by {uploader}</span>
            </span>
          ) : group.part === "Mistakes" ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              <HiXCircle className="w-3.5 h-3.5" />
              <span>Needs Review</span>
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
            <span>Corpus Mastery</span>
            <span>{group.percent}%</span>
          </div>
          <div className="w-full bg-plum/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-plum transition-all duration-500"
              style={{ width: `${group.percent}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] font-medium text-muted-label">
            <span>Know: {summary.knew}</span>
            <span>Do Not Know: {summary.unknown}</span>
            <span>Forgot: {summary.forgot}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-plum/10 gap-2">
          {group.hasMistakes ? (
            <button
              type="button"
              onClick={() => onStartDrill(group, true)}
              className="imlaa-btn-secondary text-xs py-2 px-3 text-rose-700 font-bold border-rose-300"
            >
              Mistakes ({group.mistakesCount})
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

          {group.part !== "Mistakes" && (
            <button
              type="button"
              disabled={!group.wordsCount}
              onClick={() => onStartDrill(group, false)}
              className="imlaa-btn-primary py-2 px-4 text-sm font-semibold"
            >
              Study Flashcards
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
