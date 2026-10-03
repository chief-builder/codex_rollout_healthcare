# Repository Audit — 2026-10-02

Scope: every tracked file on `main` at `aeb6f6d`, the GitHub repo metadata, the
live GitHub Pages site, and the external sources the plan cites. No CLAUDE.md
exists in the repo. Vendor facts were checked against official sources on
2026-10-02.

Sections 1–8 and the prioritized plan below are the original Phase 1
findings, kept unchanged as a dated record. The next section records how each
finding was resolved.

## Resolution status (updated 2026-10-02)

Fixed in [PR #1](https://github.com/chief-builder/codex_rollout_healthcare/pull/1)
(merge `58ab41e`), [PR #3](https://github.com/chief-builder/codex_rollout_healthcare/pull/3)
(`8513b99`), and [PR #4](https://github.com/chief-builder/codex_rollout_healthcare/pull/4)
(`35e657b`), plus repository settings applied by the owner's request on
2026-10-02. Commit hashes below are from PR #1 unless noted.

Owner decisions taken after the audit:

- License the repo under MIT.
- Move the model aliases to the GPT-6 family.
- Switch the production path from `bedrock-mantle` to `bedrock-runtime`.
- Recreate all diagrams as SVG sources.
- Deploy Pages from GitHub Actions.

### Accuracy findings

| #     | Finding                                           | Resolution                                                                                                                                       | Evidence                                   |
| ----- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| R4    | SVGs present but unused                           | ✅ Resolved: all six diagrams are SVG sources used directly by the page; PNGs removed                                                            | `09af37c`; render test "loads every image" |
| R6    | Quickstart missing browser install / Node version | ✅ Resolved: README adds `npx playwright install chromium` and Node 24; fresh clone with an empty browser cache passes                           | `b25556a`; PR #1 verification output       |
| R9    | "UNLICENSED" on a public repo                     | ✅ Resolved: MIT LICENSE added, `package.json` updated                                                                                           | `0f5be25`                                  |
| V1    | GPT-5.5/5.4 GA claim                              | Superseded: the plan now cites the GPT-6 announcements (2026-09-08, 09-22, 09-29)                                                                | `986a146`                                  |
| V2    | `gpt-5.5` as OpenAI's latest model                | ✅ Resolved: claim removed; the plan cites the GPT-6 family from the latest-model guide                                                          | `986a146`                                  |
| V3    | Stale OpenAI Bedrock guide examples               | ✅ Resolved: claim removed                                                                                                                       | `986a146`                                  |
| V4    | Redirected Mantle page; Mantle as production      | ✅ Resolved: production path is `bedrock-runtime` (AWS's recommendation); sources updated to `inference-responses-api.html` and `endpoints.html` | `986a146`; lychee: no redirects            |
| V5    | `store=false` alone treated as zero retention     | ✅ Resolved: plan requires `store=false` plus account retention mode `none` in every approved Region, enforced by SCP                            | `986a146`                                  |
| V7    | Model IDs                                         | ✅ Updated to `us.openai.gpt-6-luna`, `gpt-6.1-sol`, `gpt-6-astra`, `gpt-6-sol` (AWS model cards); HTML↔MD alias consistency is tested           | `986a146`; `test/repo.test.mjs`            |
| V8    | gpt-oss "GA" wording                              | Moot: gpt-oss tier retired                                                                                                                       | `986a146`                                  |
| V9    | One Mantle path for all models                    | Moot: confirmed that gpt-oss uses `/v1` and GPT-5.x/6.x use `/openai/v1`; the runtime path is uniform                                            | AWS model cards                            |
| V10   | `bedrock-mantle:CreateInference`                  | Superseded: IAM rewritten for runtime (`bedrock:InvokeModel` / `InvokeModelWithResponseStream`)                                                  | `986a146`                                  |
| V11   | Codex config source moved; managed-config note    | ✅ Resolved: URL updated; plan notes custom providers aren't supported in cloud-managed config and are deployed via device management            | `986a146`                                  |
| V12   | Codex logs to MLflow                              | ✅ Resolved: MLflow receives traces only; logs and metrics go to backend observability                                                           | `986a146`; `09af37c`                       |
| V15   | Kong Enterprise licensing not mentioned           | ✅ Resolved: licensing note added                                                                                                                | `986a146`                                  |
| I1    | Footer "same section structure"                   | ✅ Resolved: reworded                                                                                                                            | `986a146`                                  |
| I2    | Dangling superseded-file names                    | ✅ Resolved: reworded to "two earlier drafts not published in this repository"                                                                   | `986a146`                                  |
| I3    | Metering diagram "adapter token counts"           | ✅ Resolved: now "Policy Service Usage"                                                                                                          | `09af37c`                                  |
| I4–I6 | Diagram legend, clipping, misleading arrow        | ✅ Resolved: diagrams recreated and visually checked                                                                                             | `09af37c`                                  |
| I8    | No "as of" date                                   | ✅ Resolved: "verified as of 2026-10-02" in both plans; a test requires the dates to match                                                       | `986a146`; `cbef78b`                       |

R1–R3, R5, R7, R8, V6, V13, V14, V16 and I7 were already Verified and remain
accurate.

### Currency, design, tests, CI/CD, security, onboarding

| Area       | Finding                                                                             | Resolution                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Currency   | Node 22.13.0 in CI only; no `.nvmrc`/`engines`                                      | ✅ Node 24 LTS pinned via `.nvmrc` and `engines` (`01edc38`)                                                                                      |
| Currency   | Playwright 1.60.0                                                                   | ✅ 1.63.0 (`9a70da6`)                                                                                                                             |
| Currency   | Actions on unpinned `@v4` tags                                                      | ✅ Latest majors, SHA-pinned (`c1573bd`, `2aef0ce`)                                                                                               |
| Currency   | `@types/node` majors drifting from runtime                                          | ✅ Dependabot ignores `@types/node` major updates so types track Node 24 (PR #3)                                                                  |
| Design     | HTML↔MD drift, no checks                                                            | ✅ Partly: tests pin aliases, model IDs and verification date. Generating the HTML from one source remains a proposal                             |
| Design     | Validator lacked `try/finally`                                                      | ✅ Ported to `node:test` with `before`/`after` hooks and guaranteed browser cleanup (`ca5d7af`)                                                   |
| Design     | Diagnostic screenshot could fail the suite                                          | ✅ Screenshot is best-effort (PR #4); found as a CI flake after PR #1                                                                             |
| Design     | Pages published the whole repo                                                      | ✅ Actions deploy publishes only `_site/` (`5beddf3`, `2aef0ce`); Pages source switched to GitHub Actions                                         |
| Tests      | Links, redirect target, alt text, HTML↔MD untested                                  | ✅ Covered by `test/repo.test.mjs` and the lychee CI job; 36 tests, 100% line/branch/function coverage of `scripts/lib/content.mjs`               |
| CI/CD      | No permissions, concurrency, timeouts, lint, links                                  | ✅ All added (`c1573bd`); `main` protected by a ruleset requiring both CI checks                                                                  |
| Security   | No SECURITY.md, Dependabot, CodeQL                                                  | ✅ SECURITY.md and Dependabot (`b1da6a8`); CodeQL default setup enabled (JavaScript/TypeScript, Actions); private vulnerability reporting enabled |
| Security   | `.gitignore` gaps                                                                   | ✅ Env, editor and build files ignored (`dc5dc7c`)                                                                                                |
| Security   | New high finding from `markdownlint-cli2` (`braces`, GHSA-vfj7-8cjw-p6xm, no patch) | ✅ Replaced with the `markdownlint` library; `npm audit` reports 0 vulnerabilities                                                                |
| Onboarding | README gaps (license, status, architecture)                                         | ✅ README rewritten with summary, architecture, quickstart, configuration, tests, status and license (`b25556a`)                                  |
| Hygiene    | No LICENSE, CONTRIBUTING, CHANGELOG, templates                                      | ✅ Added (`0f5be25`, `27a075f`, `b25556a`)                                                                                                        |

### Still open

- **Vendor facts not stated in official docs** (listed under "Open Validation
  Items" in the technical plan):
  - the CloudTrail `eventName` for runtime Responses calls;
  - which Region's retention mode governs cross-Region requests;
  - which Responses parameters Bedrock Runtime accepts;
  - the Codex OTLP metrics endpoint;
  - HIPAA wording specific to cross-Region inference.

  These need validation in an AWS account during Phase 0.

- **Untested items from §5:** the Mermaid block is not parsed in CI, and phase
  names are not compared between HTML and MD.
- **Single-source redesign:** generating the HTML from one source (proposed in
  §4) has not been done.

## 1. What the project does (from the code)

This repository is a static documentation site. It is not an application. It
holds a hand-written executive HTML page (`codex_rollout_healthcare.html`), a
Markdown technical plan, and six diagram images. Together they describe a
proposed rollout of Codex CLI behind Kong and a policy service to OpenAI models
on Amazon Bedrock. GitHub Pages publishes the files from the root of `main`.
The only executable code is `scripts/validate-executive-plan.mjs`. It is a
Playwright smoke check that renders the HTML page at desktop and mobile widths.
It checks the title, four required strings, the section count (16), image
loading, console errors, and horizontal overflow.

There is no gateway, policy service, auth, token handling, metering, or MCP
code. The repo describes these components but does not implement them.

## 2. Accuracy

Legend: **Verified** (evidence given) · **Wrong** · **Partly wrong** ·
**Unverifiable**. "Internal" means checked against other files in this repo.

### README.md, package.json, repo description

| #   | Claim                                                                                                                                                                          | Status              | Evidence                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | CI badge / CI workflow exists and passes                                                                                                                                       | Verified            | `.github/workflows/ci.yml`. `gh run list`: run 27607222972 on `main` succeeded on 2026-06-16.                                                                                                                                                                                                                                                                                      |
| R2  | Live plan at `https://chief-builder.github.io/codex_rollout_healthcare/`                                                                                                       | Verified            | Returns HTTP 200. The served HTML is byte-identical to the local file (`diff`).                                                                                                                                                                                                                                                                                                    |
| R3  | `index.html` redirects the Pages root to the executive plan                                                                                                                    | Verified            | `index.html:6` uses a meta refresh to `codex_rollout_healthcare.html`.                                                                                                                                                                                                                                                                                                             |
| R4  | `assets/` contains diagrams used by the HTML plan                                                                                                                              | Partly wrong        | The six PNGs are used. The two SVGs (`executive-request-flow-diagram.svg`, `executive-rollout-roadmap-diagram.svg`) are not referenced; they are the editable sources of two of the PNGs.                                                                                                                                                                                          |
| R5  | Validator "validates layout, images, console errors, and section count"                                                                                                        | Verified            | `scripts/validate-executive-plan.mjs:101-123`. "Layout" means only a horizontal-overflow check. The script also checks the title and required text.                                                                                                                                                                                                                                |
| R6  | Quickstart `npm ci && npm run check`                                                                                                                                           | Partly wrong        | It passes from a clean clone on this Mac, but only because a Playwright browser is cached. With an empty browser cache (`PLAYWRIGHT_BROWSERS_PATH=<empty>`) it passes only through the hard-coded fallback to `/Applications/Google Chrome.app`. On Linux, Windows, or a Mac without Chrome it fails. `npx playwright install chromium` is missing, and no Node version is stated. |
| R7  | README "What This Covers" bullets (users, workflows, store=false, MLflow boundary)                                                                                             | Verified (internal) | Matches plan sections Summary, Identity, Observability, and HTML sections 1, 3 and 10.                                                                                                                                                                                                                                                                                             |
| R8  | Repo description: "Rollout plan for a governed AI coding platform in regulated healthcare: gateway policy, identity claims, metering, chargeback, and explicit rollout gates." | Verified (internal) | All five topics have sections in both documents.                                                                                                                                                                                                                                                                                                                                   |
| R9  | `package.json` `"license": "UNLICENSED"`                                                                                                                                       | Inconsistent        | The repo is **public** and has no LICENSE file. "UNLICENSED" means all rights reserved. That is a valid choice, but it is undocumented.                                                                                                                                                                                                                                            |

### Plan content: vendor and product facts (HTML + Markdown)

| #   | Claim (location)                                                                                                                                                        | Status                            | Evidence / current fact                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V1  | GPT-5.5, GPT-5.4, and Codex are GA on Amazon Bedrock as of June 1, 2026 (MD:41,93-95; HTML:612)                                                                         | Verified                          | The AWS What's New page (HTTP 200) says: "GPT-5.5, GPT-5.4, and Codex from OpenAI are now generally available on Amazon Bedrock … Posted on: Jun 1, 2026".                                                                                                                                                                                                                                                                                                                                                   |
| V2  | OpenAI's latest-model guide identifies `gpt-5.5` as the latest model (MD:45,95)                                                                                         | **Wrong (stale)**                 | `latest-model.md` now has front matter `latestModelInfo: model: gpt-6-astra` ("GPT-6 Astra is our most intelligent model yet"). Checked with curl on 2026-10-02.                                                                                                                                                                                                                                                                                                                                             |
| V3  | OpenAI's Bedrock guide shows `BedrockOpenAI` and `openai.gpt-5.5` with base URL `https://bedrock-mantle.us-east-2.api.aws/openai/v1` (MD:44,114-116)                    | **Partly wrong (stale)**          | The base URL is still in the guide (9 occurrences). The examples now use `openai.gpt-5.6-terra` (25 occurrences) and no longer `openai.gpt-5.5`. The subagent reports that the Python client is now `OpenAI(provider=bedrock(...))` and that `BedrockOpenAI` survives only as a Java class name.                                                                                                                                                                                                             |
| V4  | AWS documents the OpenAI Responses API on `bedrock-mantle` (MD:42,112-114; HTML:654)                                                                                    | Partly wrong                      | Still true, but the cited `bedrock-mantle.html` now **301-redirects** to `inference-responses-api.html`. That page now says "Use bedrock-runtime for new applications" and treats Mantle as the compatibility endpoint. The plan does not mention this.                                                                                                                                                                                                                                                      |
| V5  | AWS documents that `store=false` prevents Bedrock from retaining request/response data, which is enough for the no-raw-retention posture (MD:126,224; HTML:664)         | Partly wrong                      | AWS's statement is accurate as quoted. However, OpenAI's Bedrock guide says "Setting store: false does not guarantee ZDR" (confirmed with curl). AWS also documents an account-level data retention mode (`none`) and an IAM condition key `bedrock-mantle:DataRetentionMode`. A healthcare zero-retention posture should require both.                                                                                                                                                                      |
| V6  | AWS API patterns page lists Responses, Chat Completions, and Messages on `bedrock-mantle` (MD:43)                                                                       | Verified                          | `apis.html` (HTTP 200): "The bedrock-mantle endpoint is also fully supported and offers the Responses, Chat Completions, and Messages APIs." The same page recommends `bedrock-runtime`.                                                                                                                                                                                                                                                                                                                     |
| V7  | Model IDs `openai.gpt-oss-20b`, `openai.gpt-oss-120b`, `openai.gpt-5.5`, `openai.gpt-5.4`; Runtime ID `openai.gpt-oss-120b-1:0` (MD:99-106)                             | Verified                          | The AWS model cards list all four Mantle IDs as "Model lifecycle: Active". The gpt-oss-120b card lists `bedrock-runtime openai.gpt-oss-120b-1:0`. Per the subagent, GPT-5.5 and GPT-5.4 are Mantle-only, with end-of-life no sooner than 2027-06-01.                                                                                                                                                                                                                                                         |
| V8  | The gpt-oss aliases are "GA" (MD table; HTML table)                                                                                                                     | Partly wrong (wording)            | The model cards say "Active", launched Aug 5, 2025, and do not use the label "GA".                                                                                                                                                                                                                                                                                                                                                                                                                           |
| V9  | One Mantle path `/openai/v1/responses` for every model, gpt-oss included (MD:77,125)                                                                                    | Unverifiable (needs confirmation) | The subagent reported that gpt-oss models may use a different Mantle base path from GPT-5.x. I did not reproduce this, so it is flagged rather than marked Wrong.                                                                                                                                                                                                                                                                                                                                            |
| V10 | The IAM action `bedrock-mantle:CreateInference` exists (MD:268; HTML:856)                                                                                               | Verified                          | The Service Authorization Reference for `bedrock-mantle` lists "CreateInference — Grants permission to create an inference request".                                                                                                                                                                                                                                                                                                                                                                         |
| V11 | Codex config keys in the MD sample config (`model_providers.*.auth.command/refresh_interval_ms/timeout_ms`, `history.persistence`, `otel.*`, `wire_api="responses"`, …) | Verified, with a moved source     | Every key exists with the stated shape. `wire_api`: "responses is the only supported value". The cited URL `developers.openai.com/codex/config-reference` now **308-redirects** to `learn.chatgpt.com/docs/config-file/config-reference`. Two notes: Codex now ships a built-in `amazon-bedrock` provider, and the reference marks `model_provider`/`model_providers` as "Not supported in managed" configuration. The plan calls its sample a "Managed Codex CLI config", so the author should review this. |
| V12 | Codex OTel logs go to the collector at `/v1/logs` and on to MLflow (MD:172-185, 239-241)                                                                                | **Partly wrong**                  | MLflow documents OTLP **trace** ingestion only ("MLflow Server exposes an OTLP endpoint at /v1/traces", confirmed with curl). It documents no OTLP logs or metrics ingestion. In Codex, `[otel] exporter` is the **logs** exporter. Only `trace_exporter` data can reach MLflow, so logs and metrics need a different sink. `metrics_exporter = "otlp-http"` has no endpoint block in the sample.                                                                                                            |
| V13 | AWS HIPAA Eligible Services Reference (MD:47; HTML:715,872)                                                                                                             | Verified                          | Amazon Bedrock is listed with no bracketed exclusions. Mantle and OpenAI models are not mentioned separately, which is consistent with the plan's "confirm before PHI" wording.                                                                                                                                                                                                                                                                                                                              |
| V14 | MLflow OTLP `/v1/traces` (MD:48)                                                                                                                                        | Verified                          | See V12. Only OTLP/HTTP is supported, not gRPC.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| V15 | Kong hybrid mode with OIDC/JWT/mTLS (MD:144,249-250)                                                                                                                    | Verified, with a gap              | Kong documents hybrid mode (CP/DP) and all three plugins. The OpenID Connect and mTLS Auth plugins are marked **Enterprise only**. The plan does not mention licensing.                                                                                                                                                                                                                                                                                                                                      |
| V16 | AWS Comprehend Medical detects PHI (MD:217)                                                                                                                             | Verified                          | `API_DetectPHI` in the Comprehend Medical API reference.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### Plan content: internal consistency

| #   | Claim                                                                                                         | Status                    | Evidence                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | HTML footer: "preserving the same section structure" as the Markdown plan                                     | **Wrong**                 | The MD has 15 `##` sections. The HTML has 16 in a different arrangement: it adds "Supported Scope" and "Executive Architecture" and has no "Codex Request Flow".                                                        |
| I2  | MD:3-5 "supersedes … `healthcare-openai-bedrock-codex-plan.md` and `healthcare-mlflow-observability-plan.md`" | Unverifiable              | Neither file is in the repo or its history. This is a dangling reference to private drafts.                                                                                                                             |
| I3  | Metering diagram (`executive-metering-billing-diagram.png`) box "ADAPTER TOKEN COUNTS"                        | **Wrong**                 | The plan text says token counts come from the policy service (HTML:691; MD:194-195) and that the translation adapter "is no longer a production critical-path assumption" (MD:120-121). The PNG has no editable source. |
| I4  | Request-flow diagram (PNG/SVG) legend shows fail-closed, sanitized-observability, and metering arrows         | Wrong (presentation)      | The legend lists four arrow types, but only the primary arrow is drawn. "Retention Guard" and "Bedrock Mantle" titles overflow their boxes, and the "Response" box is clipped at the right edge.                        |
| I5  | Roadmap diagram "APP CODING TRAFFIC" header                                                                   | Presentation defect       | The text is clipped at both box edges (SVG source available).                                                                                                                                                           |
| I6  | Identity diagram: dotted red arrow from "BLOCKED" to "Approved Coding Request"                                | Misleading (presentation) | It reads as though blocked requests flow to approval. There is no editable source.                                                                                                                                      |
| I7  | Phases, approvers, aliases, fallback order, and blocked workflows agree between HTML and MD                   | Verified (internal)       | Compared section by section. The HTML adds stricter MLflow exclusions (tokens, cost, Bedrock error class), which are consistent with MD:242.                                                                            |
| I8  | No "as of" date for vendor facts on the published page                                                        | Gap                       | The footer says to "revalidate". V2–V5 show how quickly these facts go stale.                                                                                                                                           |

## 3. Currency

| Item                      | Current in repo                    | Latest stable (2026-10-02)                                 | Notes                                                                                                                                                                                                                                                                                               |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js (CI)              | `22.13.0`, pinned in `ci.yml` only | 24.21.0 (Active LTS "Krypton")                             | Node 22 has been Maintenance LTS since 2025-10-21 and reaches end of life on 2027-04-30. 22.13.0 is a January 2025 patch with many missed security releases. Node 26 becomes LTS on 2026-10-28. There is no `.nvmrc` and no `engines` field. Moving to 24 breaks nothing (Playwright needs `>=20`). |
| playwright                | 1.60.0 (`^1.60.0`)                 | 1.63.0                                                     | A semver-minor update. The only risk is a new Chromium revision changing rendering, and the validator would catch that.                                                                                                                                                                             |
| actions/checkout          | `@v4` (tag)                        | v7.0.1                                                     | Unpinned tag. Check the release notes for runner/Node requirements before bumping.                                                                                                                                                                                                                  |
| actions/setup-node        | `@v4` (tag)                        | v7.0.0                                                     | Same as above.                                                                                                                                                                                                                                                                                      |
| MCP spec                  | —                                  | —                                                          | **Not applicable.** The repo has no MCP code or MCP claims (`grep -i mcp` finds nothing).                                                                                                                                                                                                           |
| OpenAI Responses wire API | `wire_api = "responses"`           | Same                                                       | Still the only supported value.                                                                                                                                                                                                                                                                     |
| Bedrock endpoint choice   | `bedrock-mantle`                   | AWS now recommends `bedrock-runtime` for new apps          | This is a design decision for the author, not a version bump. GPT-5.5/5.4 are reportedly Mantle-only, which would still justify Mantle for the frontier aliases.                                                                                                                                    |
| Model choices             | gpt-oss-20b/120b, gpt-5.5, gpt-5.4 | All still Active. Newer models exist (gpt-5.6-_, gpt-6-_). | Not an error, but "latest" wording is stale (V2). Changing model selection is the author's call.                                                                                                                                                                                                    |

## 4. Design

- **Content duplication is the main design risk.** The HTML and the Markdown
  restate the same plan by hand, and nothing checks that they agree. I1 and I3
  are drift that has already happened. A light fix is to make the validator
  assert that shared facts (aliases, model IDs, phase names) appear in both
  files. A bigger redesign would be to generate the HTML from one source; that
  is a proposal only and is out of scope here.
- **Diagram sources:** two diagrams have SVG sources. The other four PNGs have
  no source (PNG metadata suggests they were image-generated on 2026-05-24),
  so I3 and I6 cannot be fixed by editing text.
- **Validator script:**
  - Hard-coded values (title, required strings, section count 16, viewports)
    are reasonable as test expectations at the top of a check script. They
    don't need a config system.
  - Weak spot 1: if `page.goto` or `evaluate` throws, `browser.close()` is never
    called (no `try/finally`).
  - Weak spot 2: the macOS-only fallback browser paths hide a missing
    `playwright install` locally (R6).
  - Weak spot 3: screenshots are written to the OS temp dir on every run and
    are never used.
- **Pages publishing:** the legacy branch build publishes the entire repo root
  (README, `package.json`, `scripts/`, and this AUDIT.md) as part of the site.
  This is harmless today, but the site should publish only site files.
- **Dead code:** none in the script. The SVGs are sources, not dead files.

## 5. Tests

- **What exists:** one Playwright smoke check (`npm run check`). It covers the
  executive HTML page at 1440 px and 390 px.
- **Passes from a clean clone:** yes on this Mac (Node 24.15.0, npm 11.12.1).
  With an empty browser cache it passes only through the system-Chrome
  fallback. In CI it passes because the workflow runs
  `npx playwright install --with-deps chromium`.
- **Coverage:** line coverage is not meaningful here. There is no application
  logic, only a check script. What matters is which _content properties_ are
  checked.
- **Most important untested paths:**
  1. Internal and external links in the HTML, MD, and README. Two cited URLs
     already redirect (V4, V11).
  2. `index.html` redirect target.
  3. HTML ↔ MD consistency for aliases, model IDs, and phases (I1, I3).
  4. Image `alt` text present on every `<img>`.
  5. Mermaid block in the MD parses.
- **Security-relevant paths (auth, scopes, tokens, input validation):** none
  exist in code, so there is nothing to test. The plan's own "Test Plan"
  section is a specification for a system that is not in this repo.

## 6. CI/CD

- `ci.yml` runs on push and pull_request to `main` and does: checkout →
  setup-node 22.13.0 with npm cache → `npm ci` → `playwright install
--with-deps chromium` → `npm run check`.
- Pages uses the GitHub-managed `pages-build-deployment` (legacy, branch
  `main`, path `/`). No deploy workflow file exists in the repo.
- History: the CI run on `387690d` failed and was fixed by `aeb6f6d`. Main is
  green.
- **Gaps:**
  - No `permissions:` block. The repo default is `read`, but it is not declared
    in the workflow.
  - Actions are pinned to tags, not SHAs.
  - No `concurrency`, no `timeout-minutes`.
  - No link check, no HTML/Markdown lint, no format check.
  - CI does not run on pushes to non-main branches (it does run on PRs to
    `main`).
  - No Dependabot and no CodeQL.

## 7. Security

- **Secrets:** none found in files or history (pattern grep, plus a manual read
  of every file). Sample hosts use `*.internal.example.com`. Git history has a
  single author identity.
- **Dependency audit:** `npm audit` reports 0 vulnerabilities (clean clone,
  2026-10-02).
- **Input validation / authn / authz:** no such code paths exist.
- **Workflow least privilege:** permissions are not declared, and actions are
  not SHA-pinned (see §6).
- **Missing files:**
  - No SECURITY.md, no `.github/dependabot.yml`, no CodeQL.
  - CodeQL supports both `javascript` and `actions`, so default setup is
    recommended.
  - `.gitignore` lacks `.env*`, editor directories (`.vscode/`, `.idea/`),
    `coverage/`, and `*.swp`.
- **Unsafe defaults:** the Pages legacy build publishes the whole repo (§4).
  Nothing sensitive is in it today.
- **Employer references:** none found in files, image text, or commit history.

## 8. Onboarding (README quickstart, followed exactly from a fresh clone)

1. `git clone …` succeeded.
2. `npm ci` succeeded (3 packages, 0 vulnerabilities). No Node version is
   documented. I used 24.15.0, while CI uses 22.13.0.
3. `npm run check` passed, but only because of a cached Playwright Chromium.
   With no cached browser it fell back to system Chrome and printed "Bundled
   Playwright Chromium failed to launch". **On a machine without Chrome this
   step fails.** The README must add `npx playwright install chromium`
   (`--with-deps` on Linux).
4. The README does not say where screenshots go or what output means success.
   The script prints two lines and exits 0 with no "OK" message.
5. The README has no license, no status/limitations section beyond one
   sentence, and no architecture overview of the repo itself.

## Prioritized plan for Phase 2

**P0: accuracy (the published page is wrong today)**

1. Fix V2/V3: reword "latest model" claims as dated facts, and update the
   OpenAI guide description.
2. Update the redirected source URLs (V4, V11).
3. Fix V5 (add the retention-mode requirement next to `store=false`) and V12
   (MLflow receives traces only; logs and metrics go to the backend stack).
4. Fix V8 wording and I1 (footer). Mark I2 as historical.
5. Add an "Vendor facts verified as of" date.
6. Flag V9 and the "managed config" note (V11) as open questions in the doc,
   not silent changes.
7. Fix diagram I3. Fix I4/I5 via the SVG sources.

**P1: onboarding and CI**

1. Update the README quickstart (browser install, Node version) and add the
   required README sections.
2. Pin Node 24 LTS (`.nvmrc` plus `engines`).
3. Bump Playwright to 1.63.0.
4. Harden `ci.yml`: permissions, SHA pins, concurrency, timeouts, lint and
   format check, link check.

**P2: security and hygiene**

1. Add SECURITY.md, dependabot.yml, and a CodeQL workflow (or recommend
   default setup).
2. Fill the `.gitignore` gaps.
3. Add LICENSE, CONTRIBUTING, CHANGELOG, `.editorconfig`, and issue/PR
   templates.

**P3: tests and design**

1. Add `try/finally` to the validator.
2. Add HTML↔MD consistency assertions, an `index.html` redirect check, and an
   `alt`-text check.
3. Propose (not implement) moving Pages to an Actions deploy that publishes
   only site files.
