/**
 * Flashcard quiz surface (src/components/flashcards/FlashcardQuizView.jsx)
 * Multiple-choice recall mode. Grading and persistence are handled by the
 * parent page through `onAnswer`, keeping this file purely presentational.
 */
import { HiArrowLeft, HiClock } from "react-icons/hi2";

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function FlashcardQuizView({
  questions,
  index,
  score,
  timerMinutes,
  timeRemaining,
  finished,
  saving,
  userAnswers,
  mistakeCount,
  onExit,
  onAnswer,
  onRetry,
  onReviewMistakes,
  onReturn,
}) {
  const currentQuestion = questions[index];

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
        <div className="imlaa-card p-8 bg-white border border-plum/20 shadow-md space-y-6">
          <div className="flex items-center justify-between text-sm text-muted-label font-semibold">
            <span>
              Question {index + 1} of {questions.length}
            </span>
            <span>Score: {score}</span>
          </div>

          <div className="text-center py-4 space-y-2 border-b border-plum/10">
            <h3 className="text-4xl font-black text-body-dark">
              {currentQuestion?.word}
            </h3>
            <span className="text-base text-plum font-semibold italic">
              {currentQuestion?.pos}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {(currentQuestion?.options || []).map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAnswer(option)}
                disabled={saving}
                className="p-4 rounded-xl border border-plum/20 hover:border-plum hover:bg-plum/5 text-left font-semibold text-body-dark transition cursor-pointer"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="imlaa-card p-8 bg-white border border-plum/20 shadow-md text-center space-y-6">
          <h2 className="text-3xl font-black text-body-dark">Quiz Completed!</h2>
          <div className="text-5xl font-black text-plum">
            {score} / {questions.length}
          </div>
          <p className="text-base text-muted-label">
            Accuracy: {Math.round((score / (questions.length || 1)) * 100)}%
          </p>

          {userAnswers.length > 0 && (
            <div className="max-h-48 overflow-y-auto text-left text-xs space-y-1.5 p-3 rounded-xl bg-plum/5 border border-plum/10">
              <div className="font-bold text-plum mb-1 uppercase tracking-wider text-[11px]">
                Answer Summary:
              </div>
              {userAnswers.map((answer, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1 border-b border-plum/10 last:border-0"
                >
                  <span className="font-bold text-body-dark">
                    {answer.question}:{" "}
                    <span className="font-normal text-muted-label">{answer.chosen}</span>
                  </span>
                  <span
                    className={`font-bold ${
                      answer.isCorrect ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {answer.isCorrect ? "✓ Correct" : `✗ Answer: ${answer.correct}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-plum/10">
            <button
              type="button"
              onClick={onRetry}
              className="imlaa-btn-primary py-3 px-6 text-base"
            >
              Try Again
            </button>
            {mistakeCount > 0 && (
              <button
                type="button"
                onClick={onReviewMistakes}
                className="imlaa-btn-secondary py-3 px-6 text-base text-rose-700"
              >
                Review Mistakes ({mistakeCount})
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
