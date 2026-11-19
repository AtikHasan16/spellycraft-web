import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url)));

test("PWA manifest provides install metadata and the required PNG icon sizes", () => {
  assert.equal(manifest.name, "SpellyCraft");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#6D4E56");

  for (const size of ["192x192", "512x512"]) {
    const icon = manifest.icons.find((entry) => entry.sizes === size);
    assert.ok(icon, `Missing ${size} app icon`);
    const png = readFileSync(new URL(`../public${icon.src}`, import.meta.url));
    assert.equal(png.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), Number.parseInt(size.split("x")[0], 10));
    assert.equal(png.readUInt32BE(20), Number.parseInt(size.split("x")[1], 10));
  }
});

test("document links the manifest and retains the iOS home-screen icon", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon" href="\/logo192\.png"/);
});
