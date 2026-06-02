# Healthcare AI Platform Plan: Codex CLI, Kong, Bedrock (OpenAI Models), Metering, and Observability

> This is the single authoritative plan. It supersedes and absorbs the earlier
> `healthcare-openai-bedrock-codex-plan.md` and `healthcare-mlflow-observability-plan.md`,
> which have been collapsed into this document.

## Summary

Deploy OpenAI models through Amazon Bedrock as the regulated model runtime, run Codex CLI on **managed macOS developer environments** for coding workflows, put Kong API Gateway in front of model traffic, meter and bill all usage, and use MLflow + OpenTelemetry **only for sanitized Codex CLI observability**.

Eligible users are limited to the **Software Engineering** and **Product Manager** job families. Only coding and code-adjacent product-to-engineering workflows are supported.

Endpoint scope is **macOS only**. Windows and Linux developer endpoint rollout is out of scope for this plan.

Codex CLI path:

```text
Developer terminal
  -> Codex CLI
  -> Kong Gateway `/codex/v1/responses`  (authn, authz, rate limit, metering tap)
  -> Codex coding policy service          (job-family/workflow authz, PHI policy, model aliasing, store=false)
  -> Amazon Bedrock Mantle Responses endpoint
  -> OpenAI model on Bedrock (open-weight or frontier)
Telemetry side-paths:
  Codex CLI -> OpenTelemetry Collector -> self-hosted MLflow (sanitized, observability only)
  Kong meter tap -> Metering pipeline -> Billing/chargeback ledger (system of record)
```

Application path:

```text
Healthcare app
  -> Kong Gateway data plane in healthcare AWS/VPC
  -> internal LLM policy service
  -> Amazon Bedrock Mantle Responses endpoint (for OpenAI-compatible Responses traffic)
  -> OpenAI model on Bedrock
  -> existing backend observability stack + Metering pipeline
```

References:
- AWS GA announcement for GPT-5.5, GPT-5.4, and Codex on Amazon Bedrock (June 1, 2026): https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-bedrock-openai-models-codex-generally-available/
- AWS Bedrock Mantle Responses API: https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-mantle.html
- AWS Bedrock API patterns, including OpenAI-compatible Responses, Chat Completions, and Messages on `bedrock-mantle`: https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html
- OpenAI guide for OpenAI models in Amazon Bedrock, including `BedrockOpenAI`, `openai.gpt-5.5`, and the regional Mantle base URL: https://developers.openai.com/api/docs/guides/amazon-bedrock#make-responses-api-requests
- OpenAI latest-model guide (`gpt-5.5`): https://developers.openai.com/api/docs/guides/latest-model.md
- Codex config (`otel.*`, `model_providers.*`, `wire_api`): https://developers.openai.com/codex/config-reference
- AWS HIPAA Eligible Services Reference: https://aws.amazon.com/compliance/hipaa-eligible-services-reference/
- MLflow OpenTelemetry trace ingestion `/v1/traces`: https://mlflow.org/docs/latest/genai/tracing/opentelemetry/

## Codex Request Flow (sequence)

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Codex CLI (managed macOS dev env)
    participant Tok as Token command
    participant Kong as Kong Gateway
    participant Pol as Codex policy svc
    participant BR as Amazon Bedrock Mantle
    participant Met as Metering store / backend obs
    participant OT as OTel Collector -> MLflow

    Dev->>Tok: get short-lived bearer (refresh <= 15m)
    Tok-->>Dev: OIDC/JWT (job-family claim)
    Dev->>Kong: POST /codex/v1/responses (Bearer, wire_api=responses)

    Note over Kong: validate token; authz from claims;<br/>strip client X-User-* headers;<br/>rate limit; budget check; metering tap
    alt unauthenticated / not SWE|PM / over quota / disallowed alias
        Kong-->>Dev: reject (fail closed)
    else allowed
        Kong->>Pol: forward request + validated claims
        Note over Pol: re-validate claims + workflow;<br/>PHI detect (regex + NER/DLP);<br/>resolve coding-* alias -> Bedrock Mantle model ID;<br/>force store=false
        alt PHI-like input on non-PHI route
            Pol-->>Kong: reject (fail closed)
            Kong-->>Dev: rejected
        else clean
            Pol->>BR: forward Responses -> bedrock-mantle /openai/v1/responses
            alt throttled / unavailable
                Note over Pol: backoff + retry;<br/>logged+metered fallback frontier->standard->economy;<br/>circuit breaker
                Pol->>BR: retry / fallback model
            end
            BR-->>Pol: model response (usage tokens)
            Pol-->>Kong: Responses-format SSE stream
            Kong-->>Dev: streamed completion
            Pol->>Met: usage event (resolved model ID, tokens, no content)
            Dev->>OT: sanitized telemetry (alias only, no prompts/PHI)
        end
    end
```

## Model Strategy (open-weight and frontier on Bedrock)

Bedrock is the single regulated runtime for **both** model classes. Per AWS, GPT-5.5,
GPT-5.4, and Codex from OpenAI are generally available on Amazon Bedrock as of
June 1, 2026. OpenAI's current latest-model guide identifies `gpt-5.5` as the
latest model. Production use is still gated by healthcare-specific region,
account access, quotas, budget, and compliance approvals.

| Codex alias        | Bedrock Mantle model     | Class       | Availability                         |
|--------------------|--------------------------|-------------|--------------------------------------|
| `coding-economy`   | `openai.gpt-oss-20b`     | open-weight | GA; gated by approved region, account model access, endpoint availability, and quotas |
| `coding-standard`  | `openai.gpt-oss-120b`    | open-weight | GA; gated by approved region, account model access, endpoint availability, and quotas |
| `coding-frontier`  | `openai.gpt-5.5`         | frontier    | GA on Bedrock; gated by approved region, account model access, quotas, budget, and healthcare compliance sign-off |
| `coding-frontier-p`| `openai.gpt-5.4`         | frontier    | GA on Bedrock; gated by the same healthcare controls |

- Model aliases are resolved **server-side** in the policy service; clients never send raw Bedrock model IDs. Mantle/OpenAI-compatible IDs are used for the Responses path; Runtime IDs such as `openai.gpt-oss-120b-1:0` apply only if a deliberate Converse/InvokeModel fallback path is approved.
- **Same governance, logging, metering, PHI, and authorization controls apply to open-weight and frontier models** (per current decision). The only difference is the availability gate and per-model cost/quotas.
- The frontier aliases stay disabled in config until approved region support, account model access, quotas, budgets, route controls, and compliance sign-off are confirmed.

## Bedrock Responses Integration

Codex CLI speaks the **OpenAI Responses wire API** (`wire_api = "responses"`).
Current AWS documentation states that Amazon Bedrock exposes the OpenAI Responses
API through the `bedrock-mantle` endpoint, and OpenAI's Amazon Bedrock guide shows
`BedrockOpenAI` and `https://bedrock-mantle.us-east-2.api.aws/openai/v1` for
`openai.gpt-5.5`.

The regulated production path therefore uses Kong and the policy service as the
control plane, then forwards approved Responses-format requests to Bedrock Mantle.
The old Responses-to-Converse translation adapter is no longer a production
critical-path assumption.

Requirements:

- **Production:** OpenAI Responses request -> Kong -> policy service -> Bedrock Mantle `/openai/v1/responses` -> Responses-format response/SSE back to Codex.
- Force `store=false` before the Bedrock call. AWS documents that `store=false` prevents Bedrock from retaining request or response data; this is required for the plan's no-raw-retention posture.
- Use Mantle/OpenAI-compatible model IDs behind stable `coding-*` aliases.
- Preserve IAM execution-role governance, approved model/region policies, and CloudTrail validation for the policy-service Bedrock caller.
- Validate streaming, tool/function-call shapes, stop reasons, usage fields, and error mapping for the Mantle Responses path.
- `Converse`/`InvokeModel` are fallback paths only if separately approved for a feature or model gap; if used, they require a documented translation adapter, separate load tests, and the same metering and retention controls.
- Chat Completions is not a production Codex path unless separately approved for a non-Responses use case.
- Emit per-request token counts and model ID to the metering tap regardless of path.

This integration must be load-tested before Phase 1; do not assume the old
Converse translation design is still required for Codex.

## Identity and Authorization (server-side, claims-based)

- The managed endpoint baseline is macOS only: company-managed Macs with device compliance, disk encryption, EDR, managed network controls, and centrally deployed Codex configuration/token tooling.
- Windows and Linux endpoints are not included in the rollout, testing matrix, support model, or compliance evidence for this plan.
- Managed Mac local-retention controls must cover Codex local history, Codex logs, terminal scrollback, shell history, crash reports, SQLite/runtime state, temporary files, and EDR/endpoint telemetry collection. Retention, redaction, and collection boundaries are centrally configured and evidenced before pilot use.
- **Job family and group membership are derived exclusively from validated OIDC/JWT claims server-side** (Kong validates the token; the policy service re-checks claims). Authorization decisions are never based on client-supplied headers or environment variables.
- The Codex config no longer carries job-family/group as a trusted client header. Any `X-User-*` header arriving from the client is **stripped/overwritten at Kong** and ignored for authz; the authoritative values come from the token.
- Kong enforces: token validity (OIDC/JWT/mTLS), membership in an approved Software Engineering or Product Manager group claim, consumer/app allowlist, request size limits, rate limits, timeouts, model-alias allowlist, and safe audit metadata.
- The policy service independently re-validates job family + workflow authorization before invoking Bedrock Mantle (defense in depth; never trust the upstream alone).

Managed Codex CLI config (no trusted identity headers; identity comes from a short-lived token returned by the enterprise token command):

```toml
model_provider = "kong-bedrock"
model = "coding-standard"
approval_policy = "on-request"
sandbox_mode = "workspace-write"
hide_agent_reasoning = true

[history]
persistence = "none"

[model_providers.kong-bedrock]
name = "Kong Bedrock Coding Gateway"
base_url = "https://kong-ai.internal.example.com/codex/v1"
wire_api = "responses"

[model_providers.kong-bedrock.auth]
command = "/usr/local/bin/get-kong-codex-token"   # prints a short-lived OIDC/JWT bearer; carries job-family claim
refresh_interval_ms = 900000                      # 15 min; issued token TTL must exceed this with operational buffer
timeout_ms = 5000

[model_providers.kong-bedrock.http_headers]
"X-AI-Workflow" = "coding"     # advisory only; not used for authz

[otel]
environment = "codex-pilot"
log_user_prompt = false
exporter = "otlp-http"
trace_exporter = "otlp-http"
metrics_exporter = "otlp-http"

[otel.exporter.otlp-http]
endpoint = "https://otel-codex.internal.example.com/v1/logs"
protocol = "json"

[otel.trace_exporter.otlp-http]
endpoint = "https://otel-codex.internal.example.com/v1/traces"
protocol = "json"
```

## Metering and Billing (system of record)

Metering and billing are a **first-class workstream**, separate from MLflow.
MLflow is observability only and is **not** authoritative for billing.

**Metering pipeline**
- A metering tap at Kong and in the policy service records, per request: pseudonymous user ID, team, job-family claim, Codex consumer/app, model alias, resolved Bedrock model ID, region, input/output token counts, request count, latency, status/error class, and timestamp. **No prompt/completion/PHI/source content.**
- Token counts come from the Bedrock Mantle Responses usage fields and are cross-checked against Kong request records.
- Events land in an append-only metering store (system of record) inside the healthcare AWS/VPC boundary.

**Quotas and budgets**
- Per-user, per-team, per-job-family, and per-model **soft caps** (alert + throttle) and **hard caps** (fail-closed) enforced at Kong.
- Frontier aliases carry separate, lower budgets than open-weight aliases given higher unit cost.
- Hard-cap breach returns a controlled, observable "budget exceeded" response; auth/billing failures fail **closed**.

**Chargeback / showback**
- Daily chargeback/showback export per team and job family, with model-tier cost breakdown (economy / standard / frontier).
- Cost attribution uses Bedrock unit pricing per resolved model ID.

**Reconciliation and audit**
- The append-only metering store is the **request-level system of record** for usage, token counts, model alias, resolved Bedrock model ID, and chargeback inputs.
- AWS billing data, using CUR where available and Cost Explorer where CUR is not yet available, is used as **aggregate validation** at daily/team/model-tier granularity.
- CloudTrail is used to validate that Bedrock invocation came only from approved Kong/policy-service roles, not as a per-request token ledger.
- Reconcile **metering store ↔ AWS billing aggregate ↔ chargeback ledger** within tolerance; discrepancies raise a finance/compliance alert. This is required for audit defensibility.

## PHI Detection and Data Protection

- **Detection method (layered) in the policy service before any Bedrock call:**
  1. **Regex/pattern** matchers for structured identifiers (MRN, SSN, phone, email, dates of birth, account/claim numbers).
  2. **NER / managed DLP** for unstructured PHI — e.g., AWS Comprehend Medical (PHI detection) and/or Macie-style scanning — to catch names, addresses, and clinical context that regex misses.
  3. **Heuristic gates** on payload shape/size and disallowed field names.
- On non-PHI routes (all initial routes), PHI-like input is **rejected fail-closed**, not silently forwarded.
- **Residual-risk acceptance:** NER/DLP PHI detection is probabilistic and has non-zero false negatives, especially inside source code, test fixtures, logs, and stack traces. This residual risk is formally acknowledged and accepted by Risk/Privacy, and is mitigated by (a) synthetic-data-only early phases, (b) PHI prohibited until BAA + controls land, (c) no raw payload retention anywhere, and (d) detection-tuning feedback during phased rollout.
- **Synthetic-data-only early phases** are the primary mitigation: because Phases 1–2 use only synthetic/non-PHI repos, a detection miss cannot expose real PHI while detection thresholds are still being tuned.
- Raw prompts, completions, PHI, secrets, source code, command output, diffs, and full transcripts stay **out of** Kong logs, the metering store, the backend logs, MLflow, and unmanaged local endpoint artifacts.
- Managed Mac endpoint controls explicitly cover Codex local history, Codex logs, terminal scrollback, shell history, crash reports, SQLite/runtime state, temporary files, and EDR/endpoint telemetry collection so raw prompts, source, command output, diffs, secrets, and PHI-like content are not retained locally outside approved controls.
- The policy service enforces `store=false` on every Bedrock Mantle request so Bedrock does not retain request or response data.
- PHI remains prohibited end-to-end until the AWS BAA is executed, Amazon Bedrock and the specific generally available features/routes are confirmed as HIPAA-eligible or not excluded, and compliance review, logging controls, security architecture, and route-level policies are approved.

## Resilience and Fallback Strategy

- **Retries with jittered exponential backoff** in the policy service for Bedrock throttling and transient 5xx, with bounded attempts and request deadlines.
- **Model fallback ordering** behind aliases when a model is throttled/unavailable: `coding-frontier` → `coding-standard` → `coding-economy` (configurable, policy-approved). Fallback is **logged and metered** so cost/quality shifts are visible; never silently downgrade across the open-weight/frontier boundary without recording it.
- **Circuit breaker** per model/region: trip on sustained Bedrock errors to shed load and return fast, controlled failures instead of piling up.
- **Capacity planning:** request Bedrock throughput quotas per model and region; monitor headroom; alert before saturation. Frontier models carry separate quota and budget planning.
- **Multi-region readiness:** confirm approved-region availability per model; document a secondary approved region for failover where compliance allows.
- **Failure-mode posture:** availability failures (Bedrock down, circuit open) fail **safe** with a clear error and no data loss; authorization, PHI, budget, missing `store=false`, and policy failures fail **closed**.
- Codex CLI fails closed on missing/invalid token, invalid job-family claim, disallowed region, or unapproved model alias.

## Observability (MLflow + OpenTelemetry, sanitized, Codex-only)

- Codex CLI is the only MLflow-observed workload, via **native OpenTelemetry export**.
- An internal **OpenTelemetry Collector** is the sanitization boundary before MLflow: it drops raw prompts/completions, reasoning content, shell output, source snippets, secrets, diffs, and PHI-like payloads.
- Preserved MLflow metadata only: pseudonymous developer/team/repo IDs, Codex version, model provider, model alias, session timing, tool-category counts, approval counts, command success/failure class, latency, and job family (`software_engineering` | `product_manager`).
- **Fallback visibility is intentionally out of MLflow.** MLflow records the requested `coding-*` alias only, not the resolved Bedrock model ID. When resilience fallback downgrades a request (e.g. `coding-frontier` → `coding-standard`), the actually-served model and the fallback event are observable only in the metering store and the existing backend observability stack, which retain the resolved model ID. This keeps MLflow free of model-resolution detail by design.
- Self-hosted MLflow inside the healthcare AWS/VPC boundary, approved DB backend, encrypted S3 artifacts, internal-only, SSO/OIDC. Single experiment `codex-cli-observability`.
- Kong, application, and `llm-policy-service` telemetry stay in the **existing backend observability stack**, not MLflow.
- Correlate MLflow traces ↔ Kong logs ↔ metering store ↔ CloudTrail/Bedrock events by request ID, time window, consumer, role, and model alias. Kong logs are authoritative for "entered via gateway"; CloudTrail is authoritative for Bedrock invocation identity; the metering store is authoritative for request-level usage/billing.

## Kong Platform and Routes

- Deploy Kong in **self-hosted hybrid mode**, data plane inside the healthcare AWS/VPC, behind internal load balancing only.
- Integrate with the org IdP via OIDC/JWT/mTLS.
- Supported coding-only routes:
  - `/codex/v1/responses` — Codex CLI model traffic.
  - `/ai/dev/coding` — approved application coding traffic.
- Block non-coding Agent AI routes (admin summarization, policy search, clinical drafting, patient messaging, diagnosis, treatment recommendation, claims automation, chart summarization).
- Per-route: claims-based authz, consumer/app allowlist, size/rate limits, timeouts, model-alias allowlist, metering tap, and safe audit metadata. No logging of raw prompts/completions/secrets/PHI.

## Coding Policy Services

- Re-validate job-family + coding-workflow authorization from token claims before invoking Bedrock Mantle.
- Enforce PHI detection/rejection (see PHI section); apply approved prompt templates and model-alias allowlists.
- Resolve `coding-*` aliases to Bedrock Mantle model IDs server-side.
- Enforce `store=false`, call Bedrock Mantle Responses, and emit token/usage metering.
- Reject clinical, patient-facing, revenue-cycle, or operational healthcare requests.
- Emit audit events to the existing backend observability/compliance stack without raw PHI payloads. Version prompt templates via the existing release process, not MLflow.

## Bedrock Integration

- IAM least privilege: only the policy-service execution role may invoke Bedrock Mantle, restricted to approved actions, model IDs, and regions. The IAM policy includes the current Mantle inference action set, including `bedrock-mantle:CreateInference`, for the approved regional endpoint.
- Production Bedrock invocation uses Mantle Responses under the approved policy-service execution role. Chat Completions remains non-production unless separately approved.
- Start with `openai.gpt-oss-120b` (standard) and `openai.gpt-oss-20b` (economy), after approved region selection, account model access, endpoint availability, and quota/throughput confirmation. Enable `openai.gpt-5.5` and `openai.gpt-5.4` only after the frontier gate passes.
- Confirm AWS BAA coverage, Amazon Bedrock HIPAA eligible-service status and exclusions, region/model availability, and route-specific controls before any PHI use.

## Rollout Sequence with Concrete Gates

Each phase has **entry criteria**, **exit criteria**, **required approvers**, and a **kill switch**. A phase cannot start until the prior phase's exit criteria are signed off. Approver roles: **Cyber/Security**, **Risk**, **Privacy/Compliance**, **Platform Eng**, **Finance** (for metering/billing gates).

**Global kill switch:** disabling the Kong `/codex/v1/responses` route and disabling the enterprise Codex token command/token issuance immediately stops all Codex model traffic; documented, tested, and owned by Platform Eng + Security.

| Phase | Scope | Entry criteria | Exit criteria | Approvers |
|------|-------|----------------|---------------|-----------|
| **0 — Foundations** | Build Kong, policy service, Bedrock Mantle Responses integration, metering pipeline, OTel→MLflow, no users | Architecture + threat model approved; approved region, account model access, endpoint availability, and quota/throughput confirmed for `openai.gpt-oss-20b` and `openai.gpt-oss-120b` | Mantle Responses path load-tested; `store=false` enforcement verified; any Converse/InvokeModel fallback separately approved and tested; metering reconciliation demonstrated on synthetic load; claims-based authz verified; managed Mac local-retention controls evidenced; kill switch tested; PHI detectors unit-tested | Cyber, Platform Eng, Finance |
| **1 — Synthetic pilot** | 3–5 managed macOS dev environments, **synthetic repos only**, open-weight aliases | Phase 0 exit signed | All Phase-0 controls green in real use; no PHI leakage in logs/MLflow/metering/local endpoint artifacts; auth fail-closed verified; budgets enforce | Cyber, Risk, Privacy, Platform Eng |
| **2 — Non-PHI internal repos** | Approved SWE + PM users, **non-PHI internal coding repos**, open-weight aliases, metadata-only MLflow | Phase 1 exit; PHI-detection thresholds tuned | Stable adoption metrics; daily aggregate reconciliation within tolerance; chargeback/showback reports validated by Finance; residual-risk acceptance signed by Risk/Privacy | Cyber, Risk, Privacy, Platform Eng, Finance |
| **3 — Observability + cost dashboards** | Dashboards for adoption, latency, failure classes, approval friction, model usage, Bedrock cost/quota | Phase 2 exit | Dashboards answer required queries; budget alerts wired; capacity headroom monitored | Platform Eng, Finance |
| **4 — Frontier models (gated)** | Enable `coding-frontier*` aliases | Frontier Bedrock model access confirmed for `openai.gpt-5.5` and `openai.gpt-5.4`; BAA/HIPAA eligible-service and exclusion review complete; frontier budgets + quotas set | Same controls verified on frontier path; fallback ordering tested; frontier reconciliation clean | Cyber, Risk, Privacy, Platform Eng, Finance |
| **5 — Application coding traffic** | `/ai/dev/coding` synthetic then production coding-only app traffic | Phase 3 exit (Phase 4 optional/parallel) | App path passes same authz/PHI/metering/resilience tests; uses existing backend observability | Cyber, Risk, Privacy, Platform Eng |
| **6 — PHI enablement (only if/when pursued)** | Lift synthetic-only restriction | AWS BAA executed; full compliance review; logging/security architecture approved; PHI route policies approved | Out of current scope — explicit separate approval required | Cyber, Risk, Privacy, Legal |

Codex Cloud and direct OpenAI API access remain **out of scope** for the regulated production path.

## Test Plan

Identity / authorization:
- Kong rejects unauthenticated, unauthorized, oversized, disallowed-model, and non-coding requests.
- Job family is taken from validated token claims; client-supplied `X-User-*` headers are stripped and cannot escalate privileges.
- Users outside approved SWE/PM group claims are rejected at Kong and re-rejected at the policy service.
- Codex fails closed on missing/invalid token, invalid job-family claim, disallowed region, unapproved model alias.

Bedrock Responses integration:
- Codex Responses requests pass through Kong and policy service to Bedrock Mantle `/openai/v1/responses` and stream back as Responses-format SSE for both gpt-oss and frontier models when enabled.
- `store=false` is present on every Bedrock request; any request missing it is rejected before Bedrock.
- `Converse`/`InvokeModel` fallback is validated only if separately approved for a feature, streaming, or model availability gap; Chat Completions remains non-production unless separately approved.
- Tool calls, stop reasons, usage fields, and error classes map correctly; malformed requests fail closed.

Metering / billing:
- Every request produces a metering event with token counts, model ID, and no raw content.
- Soft caps alert/throttle; hard caps fail closed with controlled response.
- Request-level metering store is authoritative for usage and chargeback inputs.
- Aggregate reconciliation (metering store ↔ AWS CUR/Cost Explorer ↔ chargeback ledger) agrees within tolerance; injected discrepancy raises an alert.
- Chargeback/showback report attributes cost per team/job family/model tier.

PHI / data protection:
- Regex + NER/DLP detectors block PHI-like input on non-PHI routes (test with synthetic PHI fixtures).
- No PHI/secrets/source/command output/diffs/raw prompts/completions appear in Kong logs, metering store, backend logs, MLflow, or unmanaged local endpoint artifacts.
- Bedrock Mantle request-retention behavior is verified with `store=false`.
- `otel.log_user_prompt = false` prevents raw prompt export; Codex local history persistence disabled.
- Managed Mac validation confirms approved retention/redaction behavior for Codex logs, terminal scrollback, shell history, crash reports, SQLite/runtime state, temporary files, and EDR/endpoint telemetry collection.

Resilience:
- Bedrock throttling/timeout triggers bounded backoff and (where approved) logged+metered model fallback.
- Circuit breaker trips and recovers; availability failures fail safe, while policy, budget, auth, PHI, and missing `store=false` failures fail closed.
- Kill switch immediately halts Codex traffic.

End-to-end:
- Approved synthetic coding requests (code explanation, generation, refactoring, tests, debugging, review, code docs, backlog-to-technical-plan, requirement-to-task decomposition) reach Bedrock and return through Kong.
- Bedrock invocation occurs only from the Kong/policy-service role (verify via CloudTrail).
- MLflow dashboards report requested model alias/provider usage, latency, failure rate, approval frequency, and adoption by team/repo hash/job family.
- Backend and metering dashboards report Bedrock throttle frequency, fallback events, served model ID, token usage, and cost.

## Assumptions

- Bedrock is the single regulated model runtime for both open-weight and frontier OpenAI models; GPT-5.5/GPT-5.4 are GA on Bedrock but remain gated by healthcare controls.
- Same governance/logging/metering/PHI/authz controls apply to open-weight and frontier models for now.
- Codex CLI runs only on managed macOS dev environments, routes through Kong, and never calls Bedrock directly.
- Windows and Linux developer endpoints are out of scope for this rollout.
- Kong is the front door for both Codex and application AI; deployed self-hosted hybrid.
- The production path is Responses -> Bedrock Mantle Responses with `store=false`; `Converse`/`InvokeModel` are separately approved fallback options only, and Chat Completions is non-production unless separately approved.
- Job family / authorization derive from validated OIDC/JWT claims server-side; client headers are not trusted.
- Metering/billing is the system of record for usage and chargeback, separate from MLflow.
- MLflow + OTel Collector observe only sanitized Codex CLI telemetry; backend observability remains system of record for Kong/app traffic.
- Supported users: Software Engineering and Product Manager job families only. Supported workflows: coding and code-adjacent product-to-engineering only.
- Direct OpenAI API access and Codex Cloud are out of scope for the regulated path.
- PHI is prohibited until BAA + full compliance/security controls are approved (Phase 6).
