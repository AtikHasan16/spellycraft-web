import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPendingBatch,
  runBulkAudioBatch,
} from "../src/utils/bulkAudio.js";

const makeTasks = (...words) => words.map((word) => ({ word }));

function run(tasks, overrides = {}) {
  return runBulkAudioBatch({
    tasks,
    generate: async () => ({ audioUrl: "https://audio.test/word.mp3", cached: false }),
    persist: async () => 1,
    wait: async () => {},
    ...overrides,
  });
}

test("buildPendingBatch deduplicates words without retaining row IDs", () => {
  assert.deepEqual(
    buildPendingBatch([
      { id: "first", word: " Analyze " },
      { id: "second", word: "analyze" },
      { id: "blank", word: " " },
    ]),
    [{ word: "Analyze" }],
  );
});

test("buildPendingBatch caps runs at 100 words", () => {
  const rows = Array.from({ length: 150 }, (_, index) => ({
    id: `row-${index}`,
    word: `word-${index}`,
  }));
  assert.equal(buildPendingBatch(rows).length, 100);
});

test("all-success run generates every task", async () => {
  const tasks = makeTasks("one", "two");
  const result = await run(tasks);
  assert.equal(result.status, "done");
  assert.equal(result.generated, tasks.length);
  assert.deepEqual(result.failed, []);
});

test("three consecutive failures block before attempting a fourth task", async () => {
  let generateCalls = 0;
  const result = await run(makeTasks("one", "two", "three", "four"), {
    generate: async () => {
      generateCalls += 1;
      throw new Error("unavailable");
    },
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.failed.length, 3);
  assert.equal(generateCalls, 3);
});

test("a success resets the consecutive failure count", async () => {
  let generateCalls = 0;
  const result = await run(makeTasks("one", "two", "three"), {
    generate: async () => {
      generateCalls += 1;
      if (generateCalls === 1) throw new Error("temporary failure");
      return { audioUrl: "https://audio.test/word.mp3", cached: false };
    },
  });
  assert.equal(result.status, "done");
  assert.equal(result.failed.length, 1);
  assert.equal(generateCalls, 3);
});

test("rate limit pauses and retries the same word without recording a failure", async () => {
  const waits = [];
  let generateCalls = 0;
  const result = await run(makeTasks("one"), {
    wait: async (duration) => waits.push(duration),
    generate: async () => {
      generateCalls += 1;
      if (generateCalls === 1) {
        throw Object.assign(new Error("rate limited"), { rateLimited: true });
      }
      return { audioUrl: "https://audio.test/word.mp3", cached: false };
    },
  });
  assert.equal(result.status, "done");
  assert.deepEqual(result.failed, []);
  assert.equal(generateCalls, 2);
  assert.ok(waits.includes(60000));
});

test("persist returning zero rows is a failure", async () => {
  const result = await run(makeTasks("one"), { persist: async () => 0 });
  assert.equal(result.status, "done");
  assert.deepEqual(result.failed, ["one"]);
});

test("stop is honored between words", async () => {
  let generateCalls = 0;
  let progress;
  const result = await run(makeTasks("one", "two"), {
    generate: async () => {
      generateCalls += 1;
      return { audioUrl: "https://audio.test/word.mp3", cached: false };
    },
    shouldStop: () => progress?.done === 1,
    onProgress: (nextProgress) => {
      progress = nextProgress;
    },
  });
  assert.equal(result.status, "stopped");
  assert.equal(generateCalls, 1);
});

test("each word attempt waits two seconds", async () => {
  const waits = [];
  await run(makeTasks("one", "two"), {
    wait: async (duration) => waits.push(duration),
  });
  assert.deepEqual(waits, [2000, 2000]);
});
