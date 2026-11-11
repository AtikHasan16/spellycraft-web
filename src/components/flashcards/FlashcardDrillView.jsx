/**
 * Flashcard drill surface (src/components/flashcards/FlashcardDrillView.jsx)
 * Owns only the drill presentation: progress, flip card, rating buttons,
 * and previous/next controls. Persistence stays in FlashcardPage.
 */
import {
  HiArrowLeft,
  HiCheckCircle,
  HiChevronLeft,
  HiChevronRight,
  HiClock,
  HiLanguage,
  HiSpeakerWave,
  HiXCircle,
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
        <div className="w-full flex flex-col space-y-6">
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
                className="imlaa-flip-face imlaa-card p-10 text-center bg-white border border-plum/20 shadow-md flex flex-col justify-between cursor-pointer min-h-95"
              >
                <div className="flex items-center justify-between text-xs font-bold text-muted-label uppercase tracking-wider">
                  <span>Front • Word Recall</span>
                  <span className="text-plum font-semibold">Press Tab or Space to Flip</span>
                </div>

                <div className="flex flex-col items-center space-y-4 my-auto">
                  <h2 className="text-4xl sm:text-5xl font-black text-body-dark tracking-tight">
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
              <div className="imlaa-flip-face imlaa-flip-face-back imlaa-card p-6 sm:p-8 text-left bg-white border border-plum/20 shadow-md flex flex-col justify-between min-h-95">
                <div className="flex flex-col space-y-4 w-full">
                  <div className="flex items-center justify-between border-b border-plum/15 pb-3">
                    <div>
                      <h3 className="text-3xl font-black text-body-dark">
                        {currentWord.word}
                      </h3>
                      <span className="text-sm text-plum font-semibold italic">
                        {currentWord.pos}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AudioEqualizer isPlaying={isSpeaking} />
                      <button
                        type="button"
                        onClick={() => onSpeak()}
                        className="w-10 h-10 rounded-xl bg-plum/10 hover:bg-plum hover:text-white text-plum flex items-center justify-center transition cursor-pointer min-h-11 min-w-11 active:scale-95"
                      >
                        <HiSpeakerWave
                          className={`w-5 h-5 ${isSpeaking ? "animate-pulse" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-label font-bold mb-1">
                      Meaning ({languageLabel})
                    </div>
                    <div className="text-xl font-bold text-body-dark">
                      {getVocabularyMeaning(currentWord, languageCode) ||
                        `No ${languageLabel} meaning saved yet.`}
                    </div>
                  </div>

                  {languageCode !== "en" && (
                    <div>
                      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-label">
                        Definition (English)
                      </div>
                      <div className="text-sm leading-relaxed text-body-dark">
                        {currentWord.definition || "No English definition generated yet."}
                      </div>
                    </div>
                  )}

                  {!["en", "bn"].includes(languageCode) &&
                    !getVocabularyMeaning(currentWord, languageCode) && (
                      <button
                        type="button"
                        onClick={() => onGenerate("meaning")}
                        disabled={generationInProgress?.id === currentWord.id}
                        className="imlaa-btn-secondary min-h-11 w-full px-4 text-sm font-semibold text-plum disabled:cursor-wait disabled:opacity-60"
                      >
                        {generationInProgress?.id === currentWord.id &&
                        generationInProgress.type === "meaning"
                          ? "Generating..."
                          : "Generate one-word meaning"}
                      </button>
                    )}

                  {!currentWord.definition && (
                    <button
                      type="button"
                      onClick={() => onGenerate("definition")}
                      disabled={generationInProgress?.id === currentWord.id}
                      className="imlaa-btn-secondary min-h-11 w-full px-4 text-sm font-semibold text-plum disabled:cursor-wait disabled:opacity-60"
                    >
                      {generationInProgress?.id === currentWord.id &&
                      generationInProgress.type === "definition"
                        ? "Generating..."
                        : "Generate definition"}
                    </button>
                  )}

                  {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-label font-bold mb-1">
                        Synonyms
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentWord.synonyms.map((syn, idx) => (
                          <span
                            key={idx}
                            className="imlaa-badge text-xs py-0.5 px-2 font-medium"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentWord.exampleUsage && (
                    <div className="p-3 rounded-xl bg-plum/5 border border-plum/20">
                      <p className="text-sm text-body-dark italic">
                        "{currentWord.exampleUsage}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-plum/15 mt-4">
                  <div className="text-xs font-bold text-muted-label uppercase tracking-wider text-center mb-2.5">
                    How well did you know this word?
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => onRate("unknown")}
                      className="p-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm flex flex-col items-center space-y-1 transition active:scale-95 cursor-pointer"
                    >
                      <HiXCircle className="w-5 h-5" />
                      <span>Didn't Know</span>
                      <span className="text-[10px] text-rose-500 font-normal">[1]</span>
                    </button>

                    <button
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => onRate("forgot")}
                      className="p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm flex flex-col items-center space-y-1 transition active:scale-95 cursor-pointer"
                    >
                      <HiClock className="w-5 h-5" />
                      <span>Forgot</span>
                      <span className="text-[10px] text-amber-500 font-normal">[2]</span>
                    </button>

                    <button
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => onRate("knew")}
                      className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm flex flex-col items-center space-y-1 transition active:scale-95 cursor-pointer"
                    >
                      <HiCheckCircle className="w-5 h-5" />
                      <span>I Knew It</span>
                      <span className="text-[10px] text-emerald-500 font-normal">[3]</span>
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
              className="imlaa-btn-secondary py-2.5 sm:py-3 px-4 sm:px-5 text-sm sm:text-base flex items-center justify-center space-x-2 w-full sm:w-auto min-h-11"
            >
              <HiChevronLeft className="w-5 h-5 shrink-0" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => onFlip(!isFlipped)}
              className="imlaa-btn-secondary py-2.5 sm:py-3 px-4 text-xs sm:text-sm w-full sm:w-auto min-h-11"
            >
              {isFlipped ? "Flip to Word" : "Flip to Meaning"}
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasAnsweredCurrent}
              className="imlaa-btn-primary py-2.5 sm:py-3 px-4 sm:px-5 text-sm sm:text-base flex items-center justify-center space-x-2 w-full sm:w-auto min-h-11"
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
