import assert from "node:assert/strict";
import test from "node:test";
import {
  GRAMMAR_UPLOAD_MODULES,
  parseGrammarQuestionImport,
  validateGrammarQuestionBatch,
} from "../src/utils/grammarQuestionImport.js";

test("exposes exactly the five selectable GrammarPage card modules", () => {
  assert.deepEqual(
    GRAMMAR_UPLOAD_MODULES.map(({ id, title }) => [id, title]),
    [
      ["parallelism", "Parallelism & Correlative Conjunctions"],
      ["parts-of-speech", "Parts of Speech & Derivations"],
      ["singular-plural-nouns", "Singular & Plural Nouns"],
      ["voice-change", "Voice Change & Passive Constraints"],
      ["modifiers-and-splices", "Dangling Modifiers & Comma Splices"],
    ],
  );
});

test("parses rows with equals-separated options and the selected module", () => {
  const result = parseGrammarQuestionImport(
    "The course teaches reading, ____ and speaking.=write=writing=to write=written=writing=Items in a parallel list should share the same form.",
    "parallelism",
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.questions, [{
    module: "parallelism",
    question: "The course teaches reading, ____ and speaking.",
    options: ["write", "writing", "to write", "written"],
    answer: "writing",
    explanation: "Items in a parallel list should share the same form.",
  }]);
});

test("reports malformed rows and invalid answers with line numbers", () => {
  const result = parseGrammarQuestionImport([
    "Choose the passive form.=The letter was sent=The letter sent=It was sent=The letter was sent=Use the passive voice.",
    "Question=Only one choice=Only one choice=Explanation",
    "Question=Yes=No=Maybe=Explanation",
  ].join("\n"), "voice-change");

  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].module, "voice-change");
  assert.deepEqual(result.errors.map(({ line }) => line), [2, 3]);
});

test("rejects duplicated questions and revalidates the insert batch", () => {
  const result = parseGrammarQuestionImport([
    "Question?=Yes=No=Yes=Explanation",
    " question? =No=Yes=No=Another explanation",
  ].join("\n"), "parallelism");

  assert.equal(result.questions.length, 1);
  assert.match(result.errors[0].message, /duplicated/i);
  assert.throws(
    () => validateGrammarQuestionBatch([
      ...result.questions,
      { ...result.questions[0] },
    ]),
    /duplicates another question/i,
  );
  assert.throws(
    () => validateGrammarQuestionBatch([
      { ...result.questions[0], module: "unrelated-module" },
    ]),
    /one of the five GrammarPage modules/i,
  );
});
