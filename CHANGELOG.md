# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.0.0] - 2026-10-02

### Changed

- Model aliases moved to the GPT-6 family on Amazon Bedrock: `coding-economy`
  → GPT-6 Luna, `coding-standard` → GPT-6.1 Sol, `coding-frontier` → GPT-6
  Astra, `coding-frontier-p` → GPT-6 Sol. The gpt-oss open-weight tier is
  retired.
- Production path moved from `bedrock-mantle` to `bedrock-runtime` with US
  geographic cross-Region inference profiles, matching AWS's current
  recommendation. IAM, rollout gates, and test plan updated to match.
- Retention control now requires account data retention mode `none` in every
  approved Region in addition to `store=false`.
- Observability corrected: MLflow ingests OTLP traces only; Codex logs and
  metrics go to backend observability.
- All six diagrams recreated as editable SVG sources; PNG exports removed.
- Runtime pinned to Node.js 24 LTS; Playwright 1.60.0 → 1.63.0.
- The validator script became a `node:test` suite with unit, content, and
  rendering tests.
- GitHub Pages now deploys from an Actions workflow that publishes only site
  files.

### Added

- "Vendor facts verified as of" date and an "Open Validation Items" list.
- Kong Enterprise licensing note for the OpenID Connect and mTLS plugins.
- Lint (html-validate, markdownlint), format (Prettier), type check (tsc),
  coverage, build, and link check (lychee) in CI.
- SECURITY.md, CONTRIBUTING.md, LICENSE (MIT), `.editorconfig`, Dependabot,
  issue and pull request templates, and AUDIT.md.

### Fixed

- Stale claims: GPT-5.5 as OpenAI's latest model, OpenAI Bedrock guide
  examples, redirected AWS and Codex documentation links.
- HTML footer claim that it preserved the Markdown plan's section structure.
- README quickstart missing the Playwright browser install step.

### Security

- CI and Pages workflows declare least-privilege permissions, pin actions to
  commit SHAs, and set timeouts and concurrency.

## [1.0.0] - 2026-06-16

### Added

- Executive HTML plan, consolidated Markdown plan, diagrams, GitHub Pages
  site, and Playwright validation in CI.

[2.0.0]: https://github.com/chief-builder/codex_rollout_healthcare/compare/aeb6f6d...main
[1.0.0]: https://github.com/chief-builder/codex_rollout_healthcare/commit/aeb6f6d
