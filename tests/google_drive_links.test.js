import assert from "node:assert/strict";
import test from "node:test";
import { isGoogleDriveLink, parseGoogleDriveLink } from "../src/utils/googleDriveLinks.js";

test("accepts HTTPS Drive file and Docs share links", () => {
  assert.equal(
    parseGoogleDriveLink("https://drive.google.com/file/d/abcdefghijk123456/view")
      ?.fileId,
    "abcdefghijk123456",
  );
  assert.equal(
    isGoogleDriveLink("https://docs.google.com/document/d/abcdefghijk123456/edit"),
    true,
  );
});

test("rejects links that are not safe Google Drive or Docs URLs", () => {
  for (const value of [
    "http://drive.google.com/file/d/abcdefghijk123456/view",
    "https://drive.google.com.evil.example/file/d/abcdefghijk123456/view",
    "https://drive.google.com:444/file/d/abcdefghijk123456/view",
    "https://example.com/file/d/abcdefghijk123456/view",
    "javascript:alert(1)",
    "https://drive.google.com/file/d/bad-id/view",
  ]) {
    assert.equal(isGoogleDriveLink(value), false, value);
  }
});
