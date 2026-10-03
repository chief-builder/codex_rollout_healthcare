// Parses every Mermaid diagram in tracked Markdown with Mermaid's own parser,
// running in Chromium because Mermaid needs a DOM.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { launchBrowser } from "../scripts/lib/browser.mjs";
import { mermaidBlocks } from "../scripts/lib/content.mjs";

const root = path.resolve(import.meta.dirname, "..");
const mermaidBundle = createRequire(import.meta.url).resolve(
  "mermaid/dist/mermaid.min.js",
);
const diagrams = execFileSync("git", ["ls-files", "*.md"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)
  .flatMap((file) =>
    mermaidBlocks(readFileSync(path.join(root, file), "utf8")).map((block) => ({
      ...block,
      file,
    })),
  );

/** @type {import("playwright").Browser} */
let browser;
/** @type {import("playwright").Page} */
let page;
before(async () => {
  browser = await launchBrowser();
  page = await browser.newPage();
  await page.setContent("<!doctype html><title>mermaid</title><body></body>");
  await page.addScriptTag({ path: mermaidBundle });
});
after(async () => {
  await browser?.close();
});

/**
 * Returns null if the diagram parses, otherwise the first line of the error.
 * @param {string} code
 */
function parseError(code) {
  return page.evaluate(async (source) => {
    try {
      // @ts-expect-error mermaid is the global set by the bundle
      await window.mermaid.parse(source);
      return null;
    } catch (error) {
      return String(error instanceof Error ? error.message : error).split(
        "\n",
      )[0];
    }
  }, code);
}

describe("Mermaid diagrams", () => {
  it("finds diagrams to check", () => {
    assert.ok(
      diagrams.length > 0,
      "no ```mermaid blocks found in tracked Markdown",
    );
  });

  it("rejects an invalid diagram (guards against a check that always passes)", async () => {
    assert.ok(await parseError("flowchart LR\n  A -->> B ]["));
  });

  for (const { file, line, code } of diagrams) {
    it(`${file}:${line} parses`, async () => {
      assert.equal(await parseError(code), null);
    });
  }
});
