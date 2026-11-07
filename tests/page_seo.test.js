import assert from "node:assert/strict";
import test from "node:test";
import { getPageSeo } from "../src/utils/pageSeo.js";

test("provides branded titles and descriptions for public pages", () => {
  const seo = getPageSeo("/");

  assert.match(seo.title, /IELTS Vocabulary.*SpellyCraft/);
  assert.match(seo.description, /vocabulary.*spelling.*grammar/i);
  assert.equal(seo.robots, "index, follow");
  assert.equal(seo.canonical, "https://www.spellycraft.com/");
});

test("marks private workspace and password reset pages as non-indexable", () => {
  for (const path of ["/workspace/grammar", "/workspace/upload-monitor", "/reset-password"]) {
    assert.equal(getPageSeo(path).robots, "noindex, nofollow");
  }
});

test("resolves grammar lesson metadata and noindexes unknown paths", () => {
  const lesson = getPageSeo("/workspace/grammar/lesson/parallelism");
  assert.match(lesson.title, /Parallelism & Correlative Conjunctions Lesson/);
  assert.equal(lesson.robots, "noindex, nofollow");

  const unknown = getPageSeo("/not-a-page");
  assert.match(unknown.title, /Page Not Found/);
  assert.equal(unknown.robots, "noindex, nofollow");
});
