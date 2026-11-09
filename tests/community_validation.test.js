import assert from "node:assert/strict";
import test from "node:test";
import { isValidHttpsUrl, validateTicketDraft } from "../src/features/community/communityValidation.js";

const validFeature = {
  requestType: "feature",
  title: "Add review reminders",
  description: "A reminder would help learners return to saved vocabulary.",
  category: "Vocabulary",
};

test("validates a feature request with minimal fields", () => {
  assert.deepEqual(validateTicketDraft(validFeature), {});
});

test("requires reproduction details for bug reports", () => {
  const errors = validateTicketDraft({ ...validFeature, requestType: "bug" });
  assert.ok(errors.stepsToReproduce);
  assert.ok(errors.expectedBehavior);
  assert.ok(errors.actualBehavior);
});

test("requires separate attribution consent and valid related URLs", () => {
  assert.ok(validateTicketDraft({ ...validFeature, allowPublicCredit: true }).publicDisplayName);
  assert.ok(validateTicketDraft({ ...validFeature, relatedUrl: "javascript:alert(1)" }).relatedUrl);
});

test("accepts only secure profile links to the expected host", () => {
  assert.equal(isValidHttpsUrl("https://github.com/example"), true);
  assert.equal(isValidHttpsUrl("https://github.com.evil.example/example", "github.com"), false);
  assert.equal(isValidHttpsUrl("http://github.com/example", "github.com"), false);
});
