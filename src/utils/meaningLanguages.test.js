import assert from "node:assert/strict";
import test from "node:test";
import {
  getMeaningField,
  getVocabularyMeaning,
  MEANING_LANGUAGES,
} from "./meaningLanguages.js";

test("supports all configured meaning languages with the correct vocabulary columns", () => {
  assert.deepEqual(
    MEANING_LANGUAGES.map(({ code }) => code),
    ["en", "bn", "zh", "hi", "es", "ar", "fr", "pt", "id", "ur"],
  );
  assert.equal(getMeaningField("bn"), "banglaMeaning");
  assert.equal(getMeaningField("zh"), "chineseMeaning");
  assert.equal(getMeaningField("id"), "indonesianMeaning");
  assert.equal(getMeaningField("ur"), "urduMeaning");
  assert.equal(getMeaningField("en"), "definition");
});

test("reads the preferred localized meaning without falling back to another language", () => {
  const word = {
    banglaMeaning: "উদাহরণ",
    hindiMeaning: "उदाहरण",
    definition: "A concise English explanation.",
  };
  assert.equal(getVocabularyMeaning(word, "hi"), "उदाहरण");
  assert.equal(getVocabularyMeaning(word, "es"), "");
  assert.equal(getVocabularyMeaning(word, "bn"), "উদাহরণ");
  assert.equal(getVocabularyMeaning(word, "en"), "A concise English explanation.");
});
