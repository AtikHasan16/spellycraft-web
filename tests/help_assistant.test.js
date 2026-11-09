import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyHelpTopic,
  getHelpAssistantReply,
} from "../src/features/help/helpAssistantUtils.js";
import { getPageSeo } from "../src/utils/pageSeo.js";

test("classifies vocabulary, grammar, and SpellyCraft platform questions", () => {
  assert.equal(classifyHelpTopic("What does this word mean?"), "vocabulary");
  assert.equal(classifyHelpTopic("Can you explain a verb tense?"), "grammar");
  assert.equal(classifyHelpTopic("Where can I find my progress?"), "platform");
  assert.equal(classifyHelpTopic("Hello"), "platform");
  assert.equal(classifyHelpTopic("Can you give an example?"), "platform");
});

test("keeps unrelated requests out of scope", () => {
  assert.equal(classifyHelpTopic("Can you write a travel itinerary?"), "unsupported");
  assert.match(getHelpAssistantReply("unsupported").text, /only help with vocabulary, grammar/i);
});

test("marks the help route as non-indexable", () => {
  assert.equal(getPageSeo("/help").robots, "noindex, nofollow");
});
