import assert from "node:assert/strict";
import test from "node:test";
import { isCorrectGrammarAnswer } from "../src/utils/grammarQuiz.js";

test("grades the answer field returned by grammar_questions", () => {
  const question = {
    question: "The course teaches reading, ____ and speaking.",
    options: ["write", "writing", "to write", "written"],
    answer: "writing",
  };

  assert.equal(isCorrectGrammarAnswer(question, "writing"), true);
  assert.equal(isCorrectGrammarAnswer(question, "write"), false);
});
