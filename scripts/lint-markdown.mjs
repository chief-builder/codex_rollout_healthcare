// Lints tracked Markdown with the markdownlint library. The markdownlint-cli2
// wrapper is not used because its glob dependency (braces) has an unpatched
// high-severity advisory (GHSA-vfj7-8cjw-p6xm).
import { globSync, readFileSync } from "node:fs";
import { lint } from "markdownlint/sync";

const files = globSync(["**/*.md", ".github/**/*.md"], {
  exclude: (file) => file.includes("node_modules"),
});
const config = JSON.parse(readFileSync(".markdownlint.json", "utf8"));
const results = lint({ files, config });
const errors = Object.entries(results).flatMap(([file, issues]) =>
  issues.map(
    (issue) =>
      `${file}:${issue.lineNumber} ${issue.ruleNames.join("/")} ${issue.ruleDescription}`,
  ),
);

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`markdownlint: ${files.length} files OK`);
