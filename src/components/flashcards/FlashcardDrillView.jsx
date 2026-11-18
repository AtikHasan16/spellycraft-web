/**
 * Flashcard drill surface (src/components/flashcards/FlashcardDrillView.jsx)
 * Owns only the drill presentation: progress, flip card, rating buttons,
 * and previous/next controls. Persistence stays in FlashcardPage.
 */
import {
  HiArrowLeft,
  HiChevronLeft,
  HiChevronRight,
  HiLanguage,
  HiSpeakerWave,
} from "react-icons/hi2";
import AudioEqualizer from "../AudioEqualizer";
import { getVocabularyMeaning } from "../../utils/meaningLanguages";

export default function FlashcardDrillView({
  currentWord,
  currentIndex,
  totalWords,
  isFlipped,
  slideDirection,
  isSpeaking,
  loading,
  selectedGroup,
  languageCode,
  languageLabel,
  generationInProgress,
  hasAnsweredCurrent,
  onBack,
  onFlip,
  onSpeak,
  onRate,
  onGenerate,
  onPrev,
  onNext,
}) {
  const meaning = currentWord ? getVocabularyMeaning(currentWord, languageCode) : "";

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
          <div className="text-xl text-plum font-semibold">Loading flashcards...</div>
        </div>
      ) : !currentWord ? (
        <div className="imlaa-card w-full p-12 text-center space-y-4">
          <div className="text-2xl font-bold text-body-dark">No words in this drill</div>
          <button type="button" onClick={onBack} className="imlaa-btn-primary text-base">
            Choose Another Topic
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col space-y-5">
          <div className="w-full flex items-center justify-between px-1">
            <span className="text-base font-bold text-body-dark bg-white px-3.5 py-1.5 rounded-xl border border-plum/20 shadow-xs">
              Card <span className="text-plum">{currentIndex + 1}</span> of {totalWords}
            </span>

            <div className="flex items-center space-x-1.5 text-xs text-muted-label">
              <HiLanguage className="w-4 h-4 text-plum" />
              <span className="font-semibold text-body-dark">{languageLabel}</span>
            </div>
          </div>

          <div
            key={currentIndex}
            className={`imlaa-flip-card-container ${
              slideDirection === "next" ? "animate-card-next" : "animate-card-prev"
            }`}
          >
            <div className={`imlaa-flip-card-inner ${isFlipped ? "is-flipped" : ""}`}>
              {/* FRONT FACE: prompt, pronunciation, flip affordance */}
              <div
                onClick={() => onFlip(true)}
                className="imlaa-flip-face imlaa-card p-6 text-center bg-white border border-plum/20 shadow-md flex flex-col justify-between cursor-pointer min-h-95"
              >
                <div className="flex items-center justify-between text-xs font-bold text-muted-label uppercase tracking-wider">
                  <span>Front • Word Recall</span>
                  <span className="text-plum font-semibold">
                    Press Tab or Space to Flip
                  </span>
                </div>

                <div className="flex flex-col items-center space-y-4 my-auto">
                  <h2 className="text-3xl sm:text-5xl font-black text-body-dark tracking-tight">
                    {currentWord.word}
                  </h2>
                  <span className="text-lg text-plum font-semibold italic">
                    {currentWord.pos || "Lexeme"}
                  </span>

                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpeak();
                      }}
                      className="w-12 h-12 rounded-xl bg-plum/10 hover:bg-plum hover:text-white text-plum flex items-center justify-center transition cursor-pointer min-h-11 min-w-11 active:scale-95"
                      title="Listen to pronunciation"
                    >
                      <HiSpeakerWave
                        className={`w-6 h-6 ${isSpeaking ? "animate-pulse" : ""}`}
                      />
                    </button>
                    <AudioEqualizer isPlaying={isSpeaking} />
                  </div>
                </div>

                <div className="pt-4 border-t border-plum/10">
                  <span className="text-sm font-semibold text-plum hover:underline">
                    Click card or press Tab to reveal meaning & details →
                  </span>
                </div>
              </div>

              {/* BACK FACE: meaning, generation actions, and self-assessment */}
              <div className="imlaa-flip-face imlaa-flip-face-back imlaa-card flex min-h-0 flex-col overflow-hidden border border-plum-border/70 bg-white p-3 text-left shadow-sm sm:p-4">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-plum-border/40 pb-3">
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold text-body-dark wrap-anywhere">
                      {currentWord.word}
                    </h3>
                    <span className="text-sm font-medium italic text-muted-label">
                      {currentWord.pos || "Lexeme"}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <AudioEqualizer isPlaying={isSpeaking} />
                    <button
                      type="button"
                      onClick={() => onSpeak()}
                      aria-label="Listen to pronunciation"
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-plum-light text-plum transition-colors duration-150 hover:bg-plum hover:text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-plum active:bg-plum-hover"
                    >
                      <HiSpeakerWave
                        className={`h-5 w-5 ${isSpeaking ? "animate-pulse" : ""}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto py-4 ">
                  <div className="flex flex-col gap-4">
                    <section>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-label">
                        Meaning ({languageLabel})
                      </div>
                      <div className="flex flex-col items-start gap-2">
                        <div className="text-xl font-bold">
                          {!["en", "bn"].includes(languageCode) && !meaning && (
                            <button
                              type="button"
                              onClick={() => onGenerate("meaning")}
                              disabled={generationInProgress?.id === currentWord.id}
                              className=" btn *:inline-flex items-center gap-1.5 rounded-xl border border-plum/20 bg-plum-light px-3 text-sm font-semibold text-plum transition-colors duration-150 hover:bg-plum/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum disabled:cursor-wait disabled:opacity-60 "
                            >
                              {generationInProgress?.id === currentWord.id &&
                              generationInProgress.type === "meaning"
                                ? "Generating meaning..."
                                : "Generate meaning"}
                            </button>
                          )}{" "}
                          <span className="text-xl font-bold text-body-dark">
                            {meaning || `No ${languageLabel} meaning yet.`}
                          </span>
                        </div>
                      </div>
                    </section>
                    {/* definition */}
                    {(currentWord.definition || languageCode !== "en") && (
                      <section>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-label">
                          Definition (English)
                        </div>
                        <div className="text-base font-medium">
                          {!currentWord.definition && (
                            <button
                              type="button"
                              onClick={() => onGenerate("definition")}
                              disabled={generationInProgress?.id === currentWord.id}
                              className=" btn *:inline-flex items-center gap-1.5 rounded-xl border border-plum/20 bg-plum-light px-3 text-sm font-semibold text-plum transition-colors duration-150 hover:bg-plum/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum disabled:cursor-wait disabled:opacity-60 "
                            >
                              {generationInProgress?.id === currentWord.id &&
                              generationInProgress.type === "definition"
                                ? "Generating definition..."
                                : "Generate definition"}
                            </button>
                          )}{" "}
                          <span className="text-base font-medium text-body-dark px-3 py-2">
                            {currentWord.definition ||
                              "No English definition generated yet."}
                          </span>
                        </div>
                      </section>
                    )}

                    {currentWord.synonyms?.length > 0 && (
                      <section>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-label">
                          Synonyms
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {currentWord.synonyms.map((syn, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-plum-light px-2.5 py-1 text-sm font-medium  text-plum"
                            >
                              {syn}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {currentWord.exampleUsage && (
                      <blockquote className="rounded-r-lg border-l-2 border-plum bg-plum-light px-3 py-2">
                        <p className="text-base font-medium italic leading-relaxed text-body-dark">
                          "{currentWord.exampleUsage}"
                        </p>
                      </blockquote>
                    )}
                  </div>
                  <div />
                </div>

                <div className="shrink-0 border-t border-plum-border/50 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                  <div className="mb-2 text-center text-xs font-medium text-muted-label">
                    How well did you know this word?
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => onRate("unknown")}
                      className="flex btn flex-col items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-1.5 py-2 text-rose-700 transition-colors duration-150 hover:bg-rose-100 active:bg-rose-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="text-center text-xs font-bold sm:text-sm">
                        Unknown
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => onRate("forgot")}
                      className="flex btn flex-col items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-1.5 py-2 text-amber-700 transition-colors duration-150 hover:bg-amber-100 active:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="text-center text-xs font-bold sm:text-sm">
                        Forgot
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => onRate("knew")}
                      className="flex btn flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-1.5 py-2 text-emerald-700 transition-colors duration-150 hover:bg-emerald-100 active:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="text-center text-xs font-bold sm:text-sm">
                        I Knew It
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 w-full">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="imlaa-btn-secondary py-2 sm:py-2 px-2 sm:px-3 text-sm sm:text-sm flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <HiChevronLeft className="w-5 h-5 shrink-0" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => onFlip(!isFlipped)}
              className="imlaa-btn-secondary py-2 sm:py-2 px-2 sm:px-3 text-sm sm:text-sm flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              {isFlipped ? "Flip to Word" : "Flip to Meaning"}
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasAnsweredCurrent}
              className="imlaa-btn-primary py-2 sm:py-3 px-2 sm:px-3 text-sm sm:text-sm flex items-center justify-center space-x-2 w-full sm:w-auto "
            >
              <span>
                {currentIndex === totalWords - 1 ? "Finish Drill" : "Next Word"}
              </span>
              <HiChevronRight className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
