export const MEANING_LANGUAGES = Object.freeze([
  { code: "en", label: "English" },
  { code: "bn", label: "Bangla" },
  { code: "zh", label: "Mandarin Chinese" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "ar", label: "Modern Standard Arabic" },
  { code: "fr", label: "French" },
  { code: "pt", label: "Portuguese" },
  { code: "id", label: "Indonesian" },
  { code: "ur", label: "Urdu" },
]);

const MEANING_FIELDS = Object.freeze({
  en: "definition",
  bn: "banglaMeaning",
  zh: "chineseMeaning",
  hi: "hindiMeaning",
  es: "spanishMeaning",
  ar: "arabicMeaning",
  fr: "frenchMeaning",
  pt: "portugueseMeaning",
  id: "indonesianMeaning",
  ur: "urduMeaning",
});

export function getMeaningField(languageCode) {
  return MEANING_FIELDS[languageCode] || MEANING_FIELDS.en;
}

export function getVocabularyMeaning(vocabulary, languageCode) {
  const field = getMeaningField(languageCode);
  return typeof vocabulary?.[field] === "string" ? vocabulary[field] : "";
}
