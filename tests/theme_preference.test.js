import assert from "node:assert/strict";
import test from "node:test";
import {
  isThemePreference,
  resolveTheme,
} from "../src/utils/themePreference.js";

test("accepts only supported theme preferences", () => {
  assert.equal(isThemePreference("light"), true);
  assert.equal(isThemePreference("dark"), true);
  assert.equal(isThemePreference("system"), true);
  assert.equal(isThemePreference("sepia"), false);
});

test("resolves explicit and system theme preferences", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
});
