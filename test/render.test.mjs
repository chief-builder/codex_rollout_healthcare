// Renders the executive plan in Chromium at desktop and mobile widths.
// Ported from scripts/validate-executive-plan.mjs; the checks are unchanged.
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { launchBrowser } from "../scripts/lib/browser.mjs";

const root = path.resolve(import.meta.dirname, "..");
const target = pathToFileURL(
  path.join(root, "codex_rollout_healthcare.html"),
).href;
const expectedTitle = "Healthcare AI Coding Platform Rollout Plan";
const expectedSections = 16;
const requiredText = [
  "Business Outcome",
  "Initial Guardrail",
  "Decision Gate",
  "PHI: gated, not initial scope",
];
const viewports = [
  { name: "desktop", width: 1440, height: 1200 },
  { name: "mobile", width: 390, height: 1000 },
];

/** @type {import("playwright").Browser} */
let browser;
before(async () => {
  browser = await launchBrowser();
});
after(async () => {
  await browser?.close();
});

for (const viewport of viewports) {
  describe(`${viewport.name} (${viewport.width}px)`, () => {
    /** @type {string[]} */
    const consoleErrors = [];
    /** @type {string[]} */
    const pageErrors = [];
    /** @type {{ title: string, text: string, missingImages: (string | null)[], scrollWidth: number, clientWidth: number, sectionCount: number }} */
    let result;

    before(async () => {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });
      try {
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto(target, { waitUntil: "load" });
        result = await page.evaluate(() => ({
          title: document.title,
          text: document.body.textContent ?? "",
          missingImages: [...document.images]
            .filter((image) => !image.complete || image.naturalWidth === 0)
            .map((image) => image.getAttribute("src")),
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          sectionCount: document.querySelectorAll("section").length,
        }));
        const screenshot = path.join(
          tmpdir(),
          `codex-rollout-healthcare-${viewport.name}.png`,
        );
        // The screenshot is a diagnostic aid, not a check; Chromium can
        // intermittently fail full-page capture, so don't fail the suite.
        try {
          await page.screenshot({ path: screenshot, fullPage: true });
          console.log(`${viewport.name}: screenshot=${screenshot}`);
        } catch (error) {
          console.warn(`${viewport.name}: screenshot skipped: ${error}`);
        }
      } finally {
        await page.close();
      }
    });

    it("has no console or page errors", () => {
      assert.deepEqual(consoleErrors, []);
      assert.deepEqual(pageErrors, []);
    });

    it("loads every image", () => {
      assert.deepEqual(result.missingImages, []);
    });

    it("has the expected title, sections and required text", () => {
      assert.equal(result.title, expectedTitle);
      assert.equal(result.sectionCount, expectedSections);
      for (const text of requiredText)
        assert.ok(result.text.includes(text), `missing "${text}"`);
    });

    it("has no horizontal overflow", () => {
      assert.ok(
        result.scrollWidth <= result.clientWidth,
        `horizontal overflow ${result.scrollWidth}px > ${result.clientWidth}px`,
      );
    });
  });
}
