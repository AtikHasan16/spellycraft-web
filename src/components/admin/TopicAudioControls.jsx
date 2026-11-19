import {
  HiCheckCircle,
  HiSpeakerWave,
  HiStopCircle,
} from "react-icons/hi2";

export default function TopicAudioControls({
  topic,
  stats,
  run,
  isRunning,
  onGenerate,
  onStop,
}) {
  if (topic.tab === "Uploaded") {
    return (
      <td className="py-3.5 px-3">
        <span className="text-xs text-muted-label italic">Browser voice</span>
      </td>
    );
  }

  if (!stats) {
    return (
      <td className="py-3.5 px-3">
        <span className="text-sm text-muted-label" aria-label="Audio counts unavailable">
          —
        </span>
      </td>
    );
  }

  const total = Number(stats.total) || 0;
  const generated = Number(stats.generated) || 0;
  const missing = Math.max(0, total - generated);
  const topicRunning = isRunning && run?.status === "running";
  const progressDone = topicRunning ? run.done : generated;
  const progressLabel = topicRunning
    ? `Generating ${run.done} / ${run.total}…`
    : `${generated} / ${total}`;
  const progressPercent = topicRunning
    ? run.total > 0 ? Math.min(100, (run.done / run.total) * 100) : 0
    : total > 0 ? Math.min(100, (generated / total) * 100) : 0;
  const showError = run && run.status !== "running" &&
    (run.status === "blocked" || run.failed?.length > 0);

  return (
    <td className="py-3.5 px-3">
      <div className="min-w-36 space-y-2">
        <div
          aria-live="polite"
          className="font-semibold text-body-dark"
        >
          {progressLabel}
        </div>
        <div
          className="h-1.5 rounded-full bg-plum/10"
          role="progressbar"
          aria-label={topicRunning
            ? `${run.done} of ${run.total} words processed`
            : `${generated} of ${total} words have audio`}
          aria-valuemin={0}
          aria-valuemax={topicRunning ? run.total : total}
          aria-valuenow={progressDone}
        >
          <div
            className="h-1.5 rounded-full bg-plum transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {topicRunning ? (
          <button
            type="button"
            onClick={onStop}
            className="imlaa-btn-secondary min-h-11 gap-1.5 px-3 text-sm"
          >
            <HiStopCircle className="h-4 w-4" aria-hidden="true" />
            Stop
          </button>
        ) : missing > 0 ? (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isRunning}
            className="imlaa-btn-secondary min-h-11 gap-1.5 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <HiSpeakerWave className="h-4 w-4" aria-hidden="true" />
            Missing {missing}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed"
          >
            <HiCheckCircle className="h-4 w-4" aria-hidden="true" />
            Ready
          </button>
        )}

        {showError && (
          <p className="max-h-16 max-w-48  text-xs text-rose-700" title={run.message}>
            {run.message}
          </p>
        )}
      </div>
    </td>
  );
}
