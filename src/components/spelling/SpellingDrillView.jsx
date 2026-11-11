/**
 * Spelling drill surface (src/components/spelling/SpellingDrillView.jsx)
 * Audio prompt, dictation input, feedback, and navigation only.
 */
import {
  HiArrowLeft,
  HiCheckCircle,
  HiChevronLeft,
  HiChevronRight,
  HiExclamationCircle,
  HiEye,
  HiSpeakerWave,
} from "react-icons/hi2";
import AudioEqualizer from "../AudioEqualizer";
import { getVocabularyMeaning } from "../../utils/meaningLanguages";

export default function SpellingDrillView({
  currentWord,
  currentIndex,
  totalWords,
  spellingInput,
  statusFeedback,
  hasAnsweredCurrent,
  evaluating,
  isSpeaking,
  loading,
  slideDirection,
  selectedGroup,
  meaningLanguageCode,
  meaningLanguageLabel,
  sessionMisspelled,
  onBack,
  onInputChange,
  onSubmit,
  onReveal,
  onNext,
  onPrev,
  onSpeak,
}) {
  const meaning =
    getVocabularyMeaning(currentWord, meaningLanguageCode) ||
    `No ${meaningLanguageLabel} meaning saved yet.`;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-6">
      <div className="w-full flex items-center justify-between text-base px-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold cursor-pointer"
        >
          <HiArrowLeft className="w-5 h-5" />
          <span>Back to Sets</span>
        </button>

        {selectedGroup && (
          <span className="imlaa-badge text-base">{selectedGroup.title}</span>
        )}
      </div>

      {loading ? (
        <div className="imlaa-card w-full p-16 text-center animate-pulse">
          <div className="text-xl text-plum font-semibold">Loading spelling list...</div>
        </div>
      ) : !currentWord ? (
        <div className="imlaa-card w-full p-12 text-center space-y-4">
          <div className="text-2xl font-bold text-body-dark">No words in this drill</div>
          <button type="button" onClick={onBack} className="imlaa-btn-primary text-base">
            Choose Another Topic
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col space-y-6">
          <div className="w-full flex items-center justify-between px-1">
            <span className="text-base font-bold text-body-dark bg-white px-3.5 py-1.5 rounded-xl border border-plum/20 shadow-xs">
              Word <span className="text-plum">{currentIndex + 1}</span> of {totalWords}
            </span>
            <span className="text-xs text-muted-label font-medium">
              {currentWord.pos || "Lexeme"}
            </span>
          </div>

          <div
            key={currentIndex}
            className={`imlaa-card p-8 sm:p-12 text-center bg-white border border-plum/20 shadow-md flex flex-col items-center space-y-6 ${
              slideDirection === "next" ? "animate-slide-next" : "animate-slide-prev"
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <button
                type="button"
                onClick={() => onSpeak()}
                title="Click to Listen"
                aria-label="Play audio pronunciation"
                className="w-20 h-20 rounded-2xl bg-plum hover:bg-plum-hover text-white flex items-center justify-center transition shadow-md cursor-pointer active:scale-95 min-h-11 min-w-11 focus-visible:ring-2 focus-visible:ring-plum"
              >
                <HiSpeakerWave
                  className={`w-10 h-10 ${isSpeaking ? "animate-pulse" : ""}`}
                />
              </button>
              <div className="flex items-center space-x-2">
                <AudioEqualizer isPlaying={isSpeaking} />
                <span className="text-sm text-muted-label font-medium">
                  {isSpeaking ? "Playing audio..." : "Click to hear the pronunciation"}
                </span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="w-full max-w-md flex flex-col space-y-4">
              <input
                type="text"
                autoFocus
                disabled={hasAnsweredCurrent}
                value={spellingInput}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Type what you hear..."
                className={`imlaa-input text-xl sm:text-2xl text-center py-4 px-6 tracking-wide transition-all ${
                  statusFeedback === "correct"
                    ? "border-emerald-600 focus:border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/30"
                    : statusFeedback === "incorrect" || statusFeedback === "revealed"
                      ? "border-rose-600 focus:border-rose-600 ring-2 ring-rose-100 bg-rose-50/30"
                      : ""
                }`}
              />

              {statusFeedback === "correct" && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-2 animate-slide-up">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-base">
                    <HiCheckCircle className="w-5 h-5" />
                    <span>Flawless Spelling!</span>
                  </div>
                  <div className="text-sm text-emerald-900">
                    <strong>{currentWord.word}</strong>
                  </div>
                  <div className="text-sm text-emerald-900">
                    {meaningLanguageLabel} meaning: {meaning}
                  </div>
                </div>
              )}

              {(statusFeedback === "incorrect" || statusFeedback === "revealed") && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left space-y-2 animate-slide-up">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold text-base">
                    <HiExclamationCircle className="w-5 h-5" />
                    <span>
                      Correct Spelling:{" "}
                      <strong className="text-lg underline ml-1">{currentWord.word}</strong>
                    </span>
                  </div>
                  <div className="text-sm text-rose-900">
                    {meaningLanguageLabel} meaning: {meaning}
                  </div>
                  {currentWord.exampleUsage && (
                    <p className="text-xs text-rose-700 italic">
                      "{currentWord.exampleUsage}"
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full">
                {!hasAnsweredCurrent ? (
                  <>
                    <button
                      type="submit"
                      disabled={evaluating || !spellingInput.trim()}
                      className="imlaa-btn-primary w-full sm:flex-1 py-3 sm:py-3.5 text-sm sm:text-base font-bold min-h-11"
                    >
                      Check Spelling
                    </button>
                    <button
                      type="button"
                      onClick={onReveal}
                      className="imlaa-btn-secondary w-full sm:w-auto py-3 sm:py-3.5 px-4 text-xs sm:text-sm flex items-center justify-center space-x-1.5 min-h-11"
                      title="Reveal correct spelling"
                    >
                      <HiEye className="w-4 h-4 shrink-0" />
                      <span>Reveal</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onNext}
                    className="imlaa-btn-primary w-full py-3 sm:py-3.5 text-sm sm:text-base font-bold flex items-center justify-center space-x-2 min-h-11"
                  >
                    <span>
                      {currentIndex === totalWords - 1 ? "Complete Session" : "Next Word"}
                    </span>
                    <HiChevronRight className="w-5 h-5 shrink-0" />
                  </button>
                )}
              </div>
            </form>

            {!hasAnsweredCurrent && (
              <p className="text-xs text-muted-label text-center">
                Answer or click "Reveal" to advance to the next word.
              </p>
            )}
          </div>

          {sessionMisspelled.length > 0 && (
            <section className="imlaa-card w-full p-5 border border-rose-200 bg-rose-50/50">
              <h3 className="text-base font-bold text-rose-800">
                Mistakes this session ({sessionMisspelled.length})
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {sessionMisspelled.map((word) => (
                  <li
                    key={word}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-body-dark"
                  >
                    Correct spelling: <strong>{word}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 w-full">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="imlaa-btn-secondary py-2.5 sm:py-3 px-4 sm:px-5 text-sm sm:text-base flex items-center justify-center space-x-2 w-full sm:w-auto min-h-11"
            >
              <HiChevronLeft className="w-5 h-5 shrink-0" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasAnsweredCurrent}
              className={`py-2.5 sm:py-3 px-5 sm:px-6 text-sm sm:text-base font-bold rounded-xl flex items-center justify-center space-x-2 transition w-full sm:w-auto min-h-11 ${
                !hasAnsweredCurrent
                  ? "bg-plum/20 text-white/60 cursor-not-allowed"
                  : "imlaa-btn-primary cursor-pointer"
              }`}
              title={!hasAnsweredCurrent ? "Please answer the current word first" : "Next Word"}
            >
              <span>
                {currentIndex === totalWords - 1 ? "Finish" : "Next Word"}
              </span>
              <HiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
