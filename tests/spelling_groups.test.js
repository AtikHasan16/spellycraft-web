import assert from "node:assert/strict";
import test from "node:test";
import { recordSpellingAttempt } from "../src/utils/spellingMastery.js";
import {
  SPELLING_GROUPS_PER_PAGE,
  buildSpellingGroups,
  buildSpellingMistakes,
  paginateSpellingGroups,
} from "../src/utils/spellingGroups.js";

const VOCAB_STATS = {
  activeTopics: [
    { title: "Academic Word List: Sublist A", count: 10 },
    { title: "Science", count: 6 },
  ],
  listeningTopics: [{ title: "Listening Set", count: 2 }],
  uploadedTopics: [{ title: "My Upload", count: 5 }],
};

function buildMastery() {
  let mastery = {};
  mastery = recordSpellingAttempt(
    mastery,
    "Academic Word List: Sublist A",
    { word: "analysis" },
    "know",
  );
  mastery = recordSpellingAttempt(
    mastery,
    "Academic Word List: Sublist A",
    { word: "approach" },
    "doNotKnow",
  );
  mastery = recordSpellingAttempt(mastery, "Science", { word: "atom" }, "forgot");
  return mastery;
}

test("spelling groups prefer local mastery over legacy cloud progress", () => {
  const visibleMastery = buildMastery();
  const groups = buildSpellingGroups({
    vocabStats: VOCAB_STATS,
    visibleMastery,
    userProgress: {
      progressByTopic: {
        "Academic Word List: Sublist A": { mastered: 9, incorrect: 9 },
      },
    },
    isAdmin: true,
    userName: "Amina",
  });

  const academic = groups.find(
    (group) => group.title === "Academic Word List: Sublist A",
  );
  assert.equal(academic.part, "All Active");
  assert.equal(academic.masteredCount, 1);
  assert.equal(academic.incorrectCount, 1);
  assert.equal(academic.percent, 10);
  assert.equal(academic.hasMistakes, true);

  const science = groups.find((group) => group.title === "Science");
  assert.equal(science.masteredCount, 0);
  assert.equal(science.incorrectCount, 1);

  const uploaded = groups.find((group) => group.part === "Uploaded");
  // Admins see unattributed uploads as "Admin", regardless of their own name.
  assert.equal(uploaded.uploaderName, "Admin");
});

test("spelling groups fall back to legacy progress until local results exist", () => {
  const groups = buildSpellingGroups({
    vocabStats: VOCAB_STATS,
    visibleMastery: {},
    userProgress: {
      progressByTopic: {
        "Academic Word List: Sublist A": { mastered: 4, incorrect: 2 },
      },
    },
    selectedGroupTitle: null,
    isAdmin: false,
    userName: "Sam",
  });

  const academic = groups.find(
    (group) => group.title === "Academic Word List: Sublist A",
  );
  assert.equal(academic.masteredCount, 4);
  assert.equal(academic.incorrectCount, 2);
  assert.equal(academic.percent, 40);
  // No progress for the other corpora.
  assert.equal(groups.find((group) => group.title === "Science").masteredCount, 0);
});

test("spelling mistakes attach their owning corpus group", () => {
  const visibleMastery = buildMastery();
  const groups = buildSpellingGroups({
    vocabStats: VOCAB_STATS,
    visibleMastery,
  });

  const mistakes = buildSpellingMistakes(visibleMastery, groups);
  assert.deepEqual(
    mistakes.map((entry) => entry.word.word),
    ["approach", "atom"],
  );
  assert.equal(mistakes[0].group.title, "Academic Word List: Sublist A");
  assert.equal(mistakes[1].group.title, "Science");

  // Unknown topics still yield a usable placeholder group.
  const orphaned = buildSpellingMistakes(
    recordSpellingAttempt({}, "Removed Corpus", { word: "ghost" }, "forgot"),
    groups,
  );
  assert.equal(orphaned[0].group.title, "Removed Corpus");
  assert.equal(orphaned[0].group.wordsCount, 0);
});

test("spelling pagination clamps out-of-range page indexes", () => {
  const groups = Array.from({ length: 8 }, (_, idx) => ({ id: idx }));

  const first = paginateSpellingGroups(groups, 0);
  assert.equal(first.totalPages, Math.ceil(8 / SPELLING_GROUPS_PER_PAGE));
  assert.equal(first.items.length, SPELLING_GROUPS_PER_PAGE);

  const overflow = paginateSpellingGroups(groups, 42);
  assert.equal(overflow.page, overflow.totalPages - 1);
  assert.equal(overflow.items.length, 8 % SPELLING_GROUPS_PER_PAGE);

  const negative = paginateSpellingGroups(groups, -5);
  assert.equal(negative.page, 0);
});
