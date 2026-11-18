/**
 * Dependency-free helpers for browser-driven bulk audio generation.
 */
export function buildPendingBatch(rows, limit = 100) {
  const maxTasks = Math.min(
    100,
    Math.max(0, Number.isFinite(limit) ? Math.floor(limit) : 100),
  );
  const seen = new Set();
  const batch = [];
  if (maxTasks === 0) return batch;

  for (const row of rows || []) {
    const word = typeof row?.word === "string" ? row.word.trim() : "";
    if (!word) continue;

    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    batch.push({ word });
    // The cap keeps each click resumable; remaining rows stay pending in the database.
    if (batch.length >= maxTasks) break;
  }

  return batch;
}

export async function runBulkAudioBatch({
  tasks,
  generate,
  persist,
  wait,
  paceMs = 2000,
  cooldownMs = 60000,
  maxConsecutiveFailures = 3,
  maxCooldowns = 3,
  shouldStop = () => false,
  onProgress = () => {},
}) {
  let index = 0;
  let generated = 0;
  let reused = 0;
  let consecutiveFailures = 0;
  let cooldownsUsed = 0;
  const failed = [];
  let status = "done";
  let message = "Audio generation complete.";

  while (index < tasks.length) {
    // Check between words only, because an in-flight request may already have uploaded audio.
    if (shouldStop()) {
      status = "stopped";
      message = "Stopped after the current word.";
      break;
    }
    if (consecutiveFailures >= maxConsecutiveFailures) {
      status = "blocked";
      message =
        "Stopped after 3 consecutive failures — the speech service looks blocked. Click Generate again later; it resumes where it stopped.";
      break;
    }

    const task = tasks[index];
    let retry = false;
    try {
      await wait(paceMs);
      const { audioUrl, cached } = await generate(task);
      const updatedRows = await persist(task, audioUrl);
      if (updatedRows === 0) {
        // A generated URL with no updated rows is not saved progress and must be retried later.
        throw new Error("Audio URL was not saved to any vocabulary rows.");
      }

      if (cached) reused += 1;
      else generated += 1;
      consecutiveFailures = 0;
    } catch (error) {
      if (error?.rateLimited && cooldownsUsed < maxCooldowns) {
        // The shared TTS limiter is 12 requests per minute, so a 429 needs a full-minute pause.
        cooldownsUsed += 1;
        consecutiveFailures = 0;
        await wait(cooldownMs);
        retry = true;
      } else {
        failed.push(task.word);
        consecutiveFailures += 1;
      }
    }

    if (retry) continue;

    index += 1;
    onProgress({
      done: index,
      total: tasks.length,
      generated,
      reused,
      failed: [...failed],
      message: `Processed ${index} of ${tasks.length} words.`,
    });
  }

  return { status, generated, reused, failed, message };
}
