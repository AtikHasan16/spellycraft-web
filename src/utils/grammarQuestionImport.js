import { GRAMMAR_TOPICS } from "../data/grammarTopics.js";

export const MAX_GRAMMAR_QUESTIONS_PER_IMPORT = 500;
export const GRAMMAR_UPLOAD_MODULES = GRAMMAR_TOPICS;
const GRAMMAR_UPLOAD_MODULE_IDS = new Set(GRAMMAR_UPLOAD_MODULES.map(({ id }) => id));

const REQUIRED_TEXT_FIELDS = ["module", "question", "answer"];

function normalizeQuestion(fields, module) {
  const question = fields[0];
  const options = fields.slice(1, -2);
  const answer = fields.at(-2);
  const explanation = fields.at(-1);
  return {
    module: module.trim(),
    question: question.trim(),
    options: options.map((option) => option.trim()),
    answer: answer.trim(),
    explanation: explanation.trim() || null,
  };
}

export function parseGrammarQuestionImport(text, defaultModule = "") {
  const questions = [];
  const errors = [];
  const duplicateKeys = new Set();
  const lines = String(text || "").split(/\r?\n/);

  lines.forEach((sourceLine, index) => {
    const lineNumber = index + 1;
    const line = sourceLine.trim();
    if (!line) return;

    const fields = line.split("=").map((field) => field.trim());
    if (fields.length < 5) {
      errors.push({
        line: lineNumber,
        message: "Expected a question, at least two options, an answer, and an explanation, separated by =.",
      });
      return;
    }

    const question = normalizeQuestion(fields, defaultModule);
    const missingField = REQUIRED_TEXT_FIELDS.find((field) => !question[field]);
    if (missingField) {
      errors.push({ line: lineNumber, message: `${missingField} cannot be empty.` });
      return;
    }
    if (!GRAMMAR_UPLOAD_MODULE_IDS.has(question.module)) {
      errors.push({ line: lineNumber, message: "Select one of the five GrammarPage modules." });
      return;
    }
    if (question.options.length < 2) {
      errors.push({ line: lineNumber, message: "Provide at least two options, each separated by =." });
      return;
    }

    const optionKeys = question.options.map((option) => option.toLocaleLowerCase());
    if (new Set(optionKeys).size !== question.options.length) {
      errors.push({ line: lineNumber, message: "Options must be unique." });
      return;
    }
    if (!question.options.some((option) => option === question.answer)) {
      errors.push({ line: lineNumber, message: "The answer must exactly match one of the options." });
      return;
    }

    const duplicateKey =
      `${question.module.toLocaleLowerCase()}:${question.question.toLocaleLowerCase()}`;
    if (duplicateKeys.has(duplicateKey)) {
      errors.push({ line: lineNumber, message: "This module/question is duplicated in the import." });
      return;
    }
    duplicateKeys.add(duplicateKey);
    questions.push(question);
  });

  if (questions.length > MAX_GRAMMAR_QUESTIONS_PER_IMPORT) {
    errors.push({
      line: null,
      message: `Imports are limited to ${MAX_GRAMMAR_QUESTIONS_PER_IMPORT} questions at a time.`,
    });
  }

  return { questions, errors };
}

export function validateGrammarQuestionBatch(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Provide at least one grammar question to import.");
  }
  if (questions.length > MAX_GRAMMAR_QUESTIONS_PER_IMPORT) {
    throw new Error(`Imports are limited to ${MAX_GRAMMAR_QUESTIONS_PER_IMPORT} questions at a time.`);
  }

  const seenQuestions = new Set();
  return questions.map((question, index) => {
    if (!question || typeof question !== "object") {
      throw new Error(`Question ${index + 1} is invalid.`);
    }

    const module = String(question.module || "").trim();
    const questionText = String(question.question || "").trim();
    const answer = String(question.answer || "").trim();
    const explanation = question.explanation == null
      ? null
      : String(question.explanation).trim() || null;
    const options = Array.isArray(question.options)
      ? question.options.map((option) => String(option).trim())
      : [];

    if (!module || !questionText || !answer) {
      throw new Error(`Question ${index + 1} needs a module, question, and answer.`);
    }
    if (!GRAMMAR_UPLOAD_MODULE_IDS.has(module)) {
      throw new Error(`Question ${index + 1} must use one of the five GrammarPage modules.`);
    }
    if (options.length < 2 || options.some((option) => !option)) {
      throw new Error(`Question ${index + 1} needs at least two non-empty options.`);
    }
    if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== options.length) {
      throw new Error(`Question ${index + 1} has duplicate options.`);
    }
    if (!options.includes(answer)) {
      throw new Error(`Question ${index + 1} answer must exactly match an option.`);
    }
    const duplicateKey = `${module.toLocaleLowerCase()}:${questionText.toLocaleLowerCase()}`;
    if (seenQuestions.has(duplicateKey)) {
      throw new Error(`Question ${index + 1} duplicates another question in this import.`);
    }
    seenQuestions.add(duplicateKey);

    return { module, question: questionText, options, answer, explanation };
  });
}
