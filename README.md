# Healthcare AI Coding Platform Rollout

[![CI](https://github.com/chief-builder/codex_rollout_healthcare/actions/workflows/ci.yml/badge.svg)](https://github.com/chief-builder/codex_rollout_healthcare/actions/workflows/ci.yml)

Executive rollout plan for a regulated healthcare coding-assistant platform: Codex CLI on managed macOS endpoints, Kong as the policy and metering gateway, Amazon Bedrock-hosted OpenAI models as the regulated runtime, and sanitized observability for platform operations.

[Live plan](https://chief-builder.github.io/codex_rollout_healthcare/) · [Executive HTML](codex_rollout_healthcare.html) · [Consolidated technical plan](healthcare-ai-platform-consolidated-plan.md)

## What This Covers

- Eligible users: Software Engineering and Product Manager job families only.
- Supported work: coding and code-adjacent product-to-engineering workflows.
- Runtime posture: Bedrock Mantle Responses behind Kong and a policy service.
- Governance: identity claims, PHI rejection, `store=false`, metering, chargeback, and explicit rollout gates.
- Observability boundary: MLflow receives sanitized Codex CLI metadata only; billing and served-model facts stay in metering/backend systems.

This is an executive and platform architecture plan, not a compliance approval. PHI use remains gated until BAA coverage, HIPAA eligibility review, logging controls, route policies, and security signoff are complete.

## Files

- `index.html` redirects the GitHub Pages root to the executive plan.
- `codex_rollout_healthcare.html` is the polished executive presentation.
- `healthcare-ai-platform-consolidated-plan.md` is the detailed source plan.
- `assets/` contains diagrams used by the HTML plan.
- `scripts/validate-executive-plan.mjs` validates layout, images, console errors, and section count.

## Local Validation

```sh
npm ci
npm run check
```
