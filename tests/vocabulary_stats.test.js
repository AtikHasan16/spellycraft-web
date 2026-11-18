import assert from "node:assert/strict";
import test from "node:test";
import { buildVocabularyStats } from "../src/utils/vocabularyStats.js";

test("aggregates counts and topic cards for every vocabulary destination", () => {
  const stats = buildVocabularyStats(
    [
      { topic: "Active", target_tab: "active", count: "4" },
      { topic: "Listening", target_tab: "listening", count: 3 },
      { topic: "Speaking", target_tab: "speaking", count: 2 },
      { topic: "Reading", target_tab: "reading", count: 5 },
      { topic: "Writing", target_tab: "writing", count: 6 },
      {
        topic: "Upload",
        target_tab: "uploaded",
        count: 7,
        uploaded_by_name: "Learner",
      },
    ],
    { isAdmin: true },
  );

  assert.equal(stats.totalCount, 27);
  assert.equal(stats.activeCount, 4);
  assert.equal(stats.listeningCount, 3);
  assert.equal(stats.speakingCount, 2);
  assert.equal(stats.readingCount, 5);
  assert.equal(stats.writingCount, 6);
  assert.equal(stats.uploadedCount, 7);
  assert.deepEqual(stats.uploadedTopics, [
    { title: "Upload", count: 7, uploaderName: "Learner" },
  ]);
  assert.deepEqual(stats.speakingTopics, [{ title: "Speaking", count: 2 }]);
});

test("aggregates row-by-row fallback results and defaults missing destination to active", () => {
  const stats = buildVocabularyStats([
    { topic: "Active", target_tab: null },
    { topic: "Active", target_tab: "active" },
    { topic: "Upload", target_tab: "uploaded", uploaded_by_name: "Learner" },
    { topic: "Upload", target_tab: "uploaded", uploaded_by_name: "Learner" },
  ]);

  assert.equal(stats.totalCount, 4);
  assert.equal(stats.activeCount, 2);
  assert.equal(stats.uploadedCount, 2);
  assert.deepEqual(stats.uploadedTopics, [
    { title: "Upload", count: 2, uploaderName: "Learner" },
  ]);
});
