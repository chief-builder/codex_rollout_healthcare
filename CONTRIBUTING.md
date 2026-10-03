# Contributing

1. Use Node.js from `.nvmrc` (24 LTS), then run `npm ci` and
   `npx playwright install chromium`.
2. Make a focused change on a branch and open a pull request against `main`.
3. Run `npm run check` (lint, format check, type check, tests) before pushing.
   `npm run format` fixes formatting.
4. Keep `codex_rollout_healthcare.html` and
   `healthcare-ai-platform-consolidated-plan.md` in sync; the tests compare
   the model alias tables in both.
5. Vendor facts (model IDs, endpoints, regions) must cite an official source,
   and the "Vendor facts verified as of" date must be updated when they change.
6. Use [Conventional Commits](https://www.conventionalcommits.org/) and only
   synthetic data.
