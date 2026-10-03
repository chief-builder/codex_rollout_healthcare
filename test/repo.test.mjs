// Static checks over the real repository files (no browser needed).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  aliasModelsFromHtml,
  aliasModelsFromMarkdown,
  imagesMissingAlt,
  localPaths,
  relativeHtmlRefs,
  relativeMarkdownLinks,
  verifiedAsOf,
} from "../scripts/lib/content.mjs";

const root = path.resolve(import.meta.dirname, "..");
/** @param {string} file */
const read = (file) => readFileSync(path.join(root, file), "utf8");

const htmlFiles = ["index.html", "codex_rollout_healthcare.html"];
const trackedFiles = execFileSync("git", ["ls-files"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);
const markdownFiles = trackedFiles.filter((file) => file.endsWith(".md"));
// content.test.mjs holds deliberate local-path fixtures for the unit tests.
const textFiles = trackedFiles.filter(
  (file) =>
    !/\.(png|jpe?g|gif|ico)$/.test(file) && file !== "test/content.test.mjs",
);

/**
 * @param {string} from
 * @param {string[]} refs
 */
function missingTargets(from, refs) {
  return refs.filter(
    (ref) => !existsSync(path.join(root, path.dirname(from), decodeURI(ref))),
  );
}

describe("repository content", () => {
  for (const file of htmlFiles) {
    it(`${file}: every relative link and image resolves`, () => {
      assert.deepEqual(missingTargets(file, relativeHtmlRefs(read(file))), []);
    });

    it(`${file}: every image has alt text`, () => {
      assert.deepEqual(imagesMissingAlt(read(file)), []);
    });
  }

  for (const file of markdownFiles) {
    it(`${file}: every relative link resolves`, () => {
      assert.deepEqual(
        missingTargets(file, relativeMarkdownLinks(read(file))),
        [],
      );
    });
  }

  it("no tracked text file contains an absolute local path", () => {
    const hits = textFiles.flatMap((file) =>
      localPaths(read(file)).map((p) => `${file}: ${p}`),
    );
    assert.deepEqual(hits, []);
  });

  it("HTML and Markdown plans map the same aliases to the same models", () => {
    const fromHtml = aliasModelsFromHtml(read("codex_rollout_healthcare.html"));
    const fromMarkdown = aliasModelsFromMarkdown(
      read("healthcare-ai-platform-consolidated-plan.md"),
    );
    assert.ok(fromHtml.size > 0, "no alias table found in the HTML plan");
    assert.deepEqual(fromHtml, fromMarkdown);
  });

  it("HTML and Markdown plans state the same vendor-facts verification date", () => {
    const html = verifiedAsOf(read("codex_rollout_healthcare.html"));
    const markdown = verifiedAsOf(
      read("healthcare-ai-platform-consolidated-plan.md"),
    );
    assert.ok(html, "no 'verified as of YYYY-MM-DD' in the HTML plan");
    assert.equal(html, markdown);
  });
});
