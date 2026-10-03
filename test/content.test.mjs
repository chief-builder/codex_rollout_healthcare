import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aliasModelsFromHtml,
  aliasModelsFromMarkdown,
  imagesMissingAlt,
  localPaths,
  mermaidBlocks,
  relativeHtmlRefs,
  relativeMarkdownLinks,
  verifiedAsOf,
} from "../scripts/lib/content.mjs";

describe("relativeHtmlRefs", () => {
  it("returns relative href, src and meta refresh targets without fragments", () => {
    const html = `
      <meta http-equiv="refresh" content="0; url=plan.html">
      <a href="docs/a.html#part">a</a><img src="assets/x.svg?v=2" alt="x">`;
    assert.deepEqual(relativeHtmlRefs(html), [
      "docs/a.html",
      "assets/x.svg",
      "plan.html",
    ]);
  });

  it("ignores external URLs, protocol-relative URLs, mailto and in-page anchors", () => {
    const html = `<a href="https://a.example">a</a><a href="//cdn.example/x">b</a>
      <a href="mailto:a@example.com">c</a><a href="#top">d</a><img src="data:image/png;base64,AA" alt="e">`;
    assert.deepEqual(relativeHtmlRefs(html), []);
  });
});

describe("relativeMarkdownLinks", () => {
  it("returns relative links and images", () => {
    const md = 'See [plan](plan.md#gates) and ![d](assets/d.svg "title").';
    assert.deepEqual(relativeMarkdownLinks(md), ["plan.md", "assets/d.svg"]);
  });

  it("ignores external links and links inside fenced code", () => {
    const md =
      "[x](https://example.com)\n```md\n[y](missing.md)\n```\n[z](#anchor)";
    assert.deepEqual(relativeMarkdownLinks(md), []);
  });
});

describe("imagesMissingAlt", () => {
  it("accepts images with descriptive alt text", () => {
    assert.deepEqual(
      imagesMissingAlt('<img src="a.svg" alt="Flow diagram">'),
      [],
    );
  });

  it("flags images with no alt or blank alt", () => {
    const html =
      '<img src="a.svg"><img src="b.svg" alt=""><img src="c.svg" alt="  ">';
    assert.equal(imagesMissingAlt(html).length, 3);
  });
});

describe("localPaths", () => {
  it("finds macOS, Linux and Windows home-directory paths", () => {
    const text = "/Users/alice/x /home/bob/y C:\\Users\\carol\\z";
    assert.deepEqual(localPaths(text), [
      "/Users/alice",
      "/home/bob",
      "C:\\Users\\carol",
    ]);
  });

  it("ignores relative paths and URLs", () => {
    assert.deepEqual(
      localPaths("assets/a.svg https://example.com/users/x"),
      [],
    );
  });
});

describe("alias model tables", () => {
  it("reads the Markdown table", () => {
    const md =
      "| `coding-standard` | `openai.gpt-oss-120b` | open-weight |\n| text | `x` |";
    assert.deepEqual(
      [...aliasModelsFromMarkdown(md)],
      [["coding-standard", "openai.gpt-oss-120b"]],
    );
  });

  it("reads the HTML table across line breaks", () => {
    const html =
      "<tr>\n<td><code>coding-economy</code></td>\n  <td><code>openai.gpt-oss-20b</code></td>";
    assert.deepEqual(
      [...aliasModelsFromHtml(html)],
      [["coding-economy", "openai.gpt-oss-20b"]],
    );
  });

  it("ignores alias mentions outside the table", () => {
    assert.equal(
      aliasModelsFromHtml("<strong><code>coding-frontier</code></strong>").size,
      0,
    );
    assert.equal(
      aliasModelsFromMarkdown("Fallback `coding-frontier` → `coding-standard`")
        .size,
      0,
    );
  });
});

describe("verifiedAsOf", () => {
  it("extracts the ISO date", () => {
    assert.equal(
      verifiedAsOf("Vendor facts verified as of 2026-10-02."),
      "2026-10-02",
    );
  });

  it("returns null when absent or malformed", () => {
    assert.equal(verifiedAsOf("verified as of October 2026"), null);
    assert.equal(verifiedAsOf(""), null);
  });
});

describe("mermaidBlocks", () => {
  it("returns each mermaid block with its opening-fence line", () => {
    const md =
      "# Title\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\ntext\n```mermaid\nsequenceDiagram\n```\n";
    assert.deepEqual(mermaidBlocks(md), [
      { line: 3, code: "flowchart LR\n  A --> B\n" },
      { line: 9, code: "sequenceDiagram\n" },
    ]);
  });

  it("ignores other fenced languages and inline mentions", () => {
    const md =
      "```text\nflowchart LR\n```\nUse ```mermaid``` inline.\n```js\nmermaid()\n```\n";
    assert.deepEqual(mermaidBlocks(md), []);
  });
});
