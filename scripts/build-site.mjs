// Copies only the files GitHub Pages should publish into _site/.
import { cpSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "_site");
const siteFiles = ["index.html", "codex_rollout_healthcare.html", "assets"];

rmSync(out, { recursive: true, force: true });
for (const file of siteFiles) {
  cpSync(path.join(root, file), path.join(out, file), { recursive: true });
}
console.log(`Built ${siteFiles.join(", ")} into _site/`);
