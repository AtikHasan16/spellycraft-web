/**
 * Spelling quiz surface (src/components/spelling/SpellingQuizView.jsx)
 * Audio-first dictation quiz. Grading/persistence stay in SpellingPage.
 */
import { HiArrowLeft, HiClock, HiSpeakerWave } from "react-icons/hi2";
import { getVocabularyMeaning } from "../../utils/meaningLanguages";

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function SpellingQuizView({
  questions,
  index,
  score,
  timerMinutes,
  timeRemaining,
  finished,
  input,
  misspelled,
  submitting,
  meaningLanguageCode,
  meaningLanguageLabel,
  quizMastery,
  mistakeCount,
  onExit,
  onInputChange,
  onSubmit,
  onSpeak,
  onRetry,
  onPracticeMistakes,
  onReturn,
}) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-6">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold cursor-pointer"
        >
          <HiArrowLeft className="w-5 h-5" />
          <span>Exit Quiz</span>
        </button>

        {timerMinutes > 0 && (
          <div className="flex items-center space-x-2 bg-plum/10 text-plum font-mono font-bold px-3 py-1 rounded-xl">
            <HiClock className="w-5 h-5" />
            <span>{formatTimer(timeRemaining)}</span>
          </div>
        )}
      </div>

      {!finished && questions.length > 0 ? (
        <div className="imlaa-card p-8 bg-white border border-plum/20 shadow-md space-y-6 text-center">
          <div className="flex items-center justify-between text-sm text-muted-label font-semibold">
            <span>
              Question {index + 1} of {questions.length}
            </span>
            <span>Score: {score}</span>
          </div>

          <div className="py-4 space-y-3">
            <button
              type="button"
              onClick={() => onSpeak(questions[index])}
              className="w-20 h-20 rounded-2xl bg-plum hover:bg-plum-hover text-white mx-auto flex items-center justify-center transition shadow-md cursor-pointer"
            >
              <HiSpeakerWave className="w-10 h-10" />
            </button>
            <div className="text-sm text-muted-label font-medium">
              Listen to the pronunciation and spell it below:
            </div>
          </div>

          <form onSubmit={onSubmit} className="max-w-md mx-auto space-y-4">
            <input
              type="text"
              autoFocus
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type your spelling..."
              className="imlaa-input text-xl text-center py-3.5 px-6"
            />
            <button
              type="submit"
              disabled={!input.trim() || submitting}
              className="imlaa-btn-primary w-full py-3.5 text-base font-bold"
            >
              {submitting ? "Saving..." : "Submit & Next"}
            </button>
          </form>

          {misspelled.length > 0 && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 text-left">
              <h3 className="font-bold text-rose-800">
                Mistakes so far ({misspelled.length})
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {misspelled.map((word) => (
                  <li
                    key={word.id || word.word}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-body-dark"
                  >
                    Correct spelling: <strong>{word.word}</strong>
                    <span className="ml-1 text-muted-label">
                      · {meaningLanguageLabel}:{" "}
                      {getVocabularyMeaning(word, meaningLanguageCode) ||
                        `No ${meaningLanguageLabel} meaning saved`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="imlaa-card p-8 bg-white border border-plum/20 shadow-md text-center space-y-6">
          <h2 className="text-3xl font-black text-body-dark">Spelling Quiz Completed!</h2>
          <div className="text-5xl font-black text-plum">
            {score} / {questions.length}
          </div>
          <p className="text-base text-muted-label">
            Accuracy: {Math.round((score / (questions.length || 1)) * 100)}%
          </p>

          <section className="rounded-2xl border border-plum/15 bg-stone-50 p-5 text-left">
            <h3 className="text-base font-black text-body-dark">Corpus Mastery</h3>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-emerald-50 p-3">
                <div className="text-2xl font-black text-emerald-700">
                  {quizMastery.know}
                </div>
                <div className="text-xs font-bold text-emerald-800">Know</div>
              </div>
              <div className="rounded-xl bg-rose-50 p-3">
                <div className="text-2xl font-black text-rose-700">
                  {quizMastery.doNotKnow}
                </div>
                <div className="text-xs font-bold text-rose-800">Do Not Know</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <div className="text-2xl font-black text-amber-700">
                  {quizMastery.forgot}
                </div>
                <div className="text-xs font-bold text-amber-800">Forgot</div>
              </div>
            </div>
          </section>

          {misspelled.length > 0 && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 text-left">
              <h3 className="font-bold text-rose-800">
                Mistakes in this quiz ({misspelled.length})
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {misspelled.map((word) => (
                  <li
                    key={word.id || word.word}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-body-dark"
                  >
                    Correct spelling: <strong>{word.word}</strong>
                    <span className="ml-1 text-muted-label">
                      · {meaningLanguageLabel}:{" "}
                      {getVocabularyMeaning(word, meaningLanguageCode) ||
                        `No ${meaningLanguageLabel} meaning saved`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-plum/10">
            <button
              type="button"
              onClick={onRetry}
              className="imlaa-btn-primary py-3 px-6 text-base font-bold"
            >
              Try Again
            </button>
            {mistakeCount > 0 && (
              <button
                type="button"
                onClick={onPracticeMistakes}
                className="imlaa-btn-secondary py-3 px-6 text-base text-rose-700"
              >
                Practice Mistakes ({mistakeCount})
              </button>
            )}
            <button
              type="button"
              onClick={onReturn}
              className="imlaa-btn-secondary py-3 px-6 text-base"
            >
              Return to Sets
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
