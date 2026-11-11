import assert from "node:assert/strict";
import test from "node:test";
import { recordFlashcardAttempt } from "../src/utils/flashcardMastery.js";
import {
  FLASHCARD_GROUPS_PER_PAGE,
  buildFlashcardGroups,
  paginateFlashcardGroups,
} from "../src/utils/flashcardGroups.js";

const VOCAB_STATS = {
  totalCount: 17,
  activeTopics: [
    { title: "Academic Word List: Sublist A", count: 10 },
    { title: "Science", count: 6 },
  ],
  listeningTopics: [{ title: "Listening Set", count: 2 }],
  uploadedTopics: [{ title: "My Upload", count: 5, uploaderName: "Rina" }],
};

function buildMastery() {
  let mastery = {};
  mastery = recordFlashcardAttempt(
    mastery,
    "Academic Word List: Sublist A",
    { word: "analysis" },
    "knew",
  );
  mastery = recordFlashcardAttempt(
    mastery,
    "Academic Word List: Sublist A",
    { word: "approach" },
    "unknown",
  );
  mastery = recordFlashcardAttempt(mastery, "Science", { word: "atom" }, "forgot");
  return mastery;
}

test("flashcard groups derive mastery and mistake counts from local + cloud data", () => {
  const groups = buildFlashcardGroups({
    vocabStats: VOCAB_STATS,
    masteryRecords: buildMastery(),
    cloudProgressByTopic: {
      "Academic Word List: Sublist A": {
        knownWords: ["legacy-term"],
        unknownWords: ["remote-term"],
        forgotWords: [],
      },
    },
    isAdmin: true,
    userName: "Amina",
  });

  const academic = groups.find((group) => group.title === "Academic Word List: Sublist A");
  assert.equal(academic.part, "All Active");
  assert.equal(academic.wordsCount, 10);
  // Local knew=1, legacy known=1 → max keeps the higher value.
  assert.equal(academic.knownCount, 1);
  // One local mistake + one remote-only mistake.
  assert.equal(academic.mistakesCount, 2);
  assert.equal(academic.percent, 10);
  assert.equal(academic.hasMistakes, true);

  const listening = groups.find((group) => group.part === "Listening Vocabs");
  assert.equal(listening.percent, 0);

  const uploaded = groups.find((group) => group.part === "Uploaded");
  assert.equal(uploaded.uploaderName, "Rina");
  assert.equal(uploaded.wordsCount, 5);

  const mistakeCard = groups.find((group) => group.part === "Mistakes");
  assert.equal(mistakeCard.title, "Academic Word List: Sublist A");
  assert.equal(mistakeCard.wordsCount, 2);
});

test("flashcard groups omit mistake cards when nothing needs review", () => {
  const groups = buildFlashcardGroups({
    vocabStats: VOCAB_STATS,
    masteryRecords: {},
    cloudProgressByTopic: {},
    isAdmin: false,
    userName: "Sam",
  });

  assert.equal(groups.filter((group) => group.part === "Mistakes").length, 0);
  // An explicit uploader name wins over the viewer's own name.
  assert.equal(
    groups.find((group) => group.part === "Uploaded").uploaderName,
    "Rina",
  );
});

test("flashcard pagination clamps out-of-range page indexes", () => {
  const groups = Array.from({ length: 8 }, (_, idx) => ({ id: idx }));

  const first = paginateFlashcardGroups(groups, -3);
  assert.equal(first.page, 0);
  assert.equal(first.totalPages, Math.ceil(8 / FLASHCARD_GROUPS_PER_PAGE));
  assert.equal(first.items.length, FLASHCARD_GROUPS_PER_PAGE);

  const last = paginateFlashcardGroups(groups, 99);
  assert.equal(last.page, last.totalPages - 1);
  assert.equal(last.items.length, 8 % FLASHCARD_GROUPS_PER_PAGE);

  const empty = paginateFlashcardGroups([], 0);
  assert.deepEqual(empty, { totalPages: 1, page: 0, items: [] });
});
