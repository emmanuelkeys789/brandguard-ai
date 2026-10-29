# BrandGuard AI — Round 3 Final Product Submission

**Production Live URL:** [https://buildguardai.netlify.app/](https://buildguardai.netlify.app/)  
**Source Repository:** [https://github.com/emmanuelkeys789/brandguard-ai.git](https://github.com/emmanuelkeys789/brandguard-ai.git)  
**Hackathon Stage:** Round 3 (Final Submission)  
**Author:** BrandGuard AI Team (Code Axis Project)  
**Date:** October 2026

---

## 1. Product Purpose & Overview

**BrandGuard AI** is an enterprise-grade brand governance, multimodal compliance, and pre-publication verification platform. It solves a critical risk facing modern marketing, communications, and legal teams: preventing unauthorized claims, inconsistent brand assets, inaccessible media, and off-brand copy from reaching public distribution.

Unlike black-box grammar checkers or hallucination-prone generic LLMs, BrandGuard AI implements a **deterministic-first policy engine** coupled with **advisory contextual AI reasoning**, **multimodal visual compliance**, and an **auditable human-in-the-loop signoff chain**.

### Core Value Proposition
- **Deterministic Policy Verification:** Zero hallucination. Brand guidelines, prohibited claims, trademark rules, and required disclaimers evaluate with 100% mathematical consistency.
- **Contextual AI Tone & Voice Analysis:** Advisory evaluations analyze nuance, formality, and audience resonance against corporate brand profiles, providing drop-in substantive rewrites without altering deterministic compliance scores.
- **Multimodal Visual & Alt-Text Audit:** Ingests marketing creative assets (PNG, JPEG, WEBP), logo clear-space rules, WCAG color contrast guidelines, and performs rigorous author alt-text accessibility evaluations.
- **Role-Based Governance (RBAC):** Strict permissions enforce separation between Creators/Editors (draft creation, AI checks) and Reviewers/Admins (approvals, rejections, change requests, publishing).
- **Idempotent Webhook Publishing:** Secure downstream dispatch with HMAC-SHA256 request signatures, deterministic idempotency keys, SSRF protection, and offline demo simulation.
- **Audit Ledger & Historical Integrity:** Immutable first-pass scoring preserves baseline compliance across revisions; transparently disclaims client-side demo storage vs. authoritative cloud PostgreSQL records.

---

## 2. Complete Feature List

### A. Pre-Publication Content Checking & Deterministic Rule Engine
- **Configurable Brand Guidelines:** Rule repository supporting category taxonomy, severities (`Critical`, `High`, `Medium`, `Low`, `Advisory`), exact phrase matching, regex boundaries, punctuation insensitivity, and rule status toggling.
- **Deterministic Compliance Scoring:** Mathematical formula weighting findings by severity. A compliant draft scores 100%; violations scale deterministically based on severity deductions.
- **Sentence-Level Citation Mapping:** Every violation cites the exact matched substring, line number, rule title, rule ID, and suggested remedy.
- **1-Click Apply to Draft:** Automatically updates the active draft with suggested corrections while preserving the immutable original draft.

### B. Advisory AI Tone & Voice Review
- **Substantive Rewriting Engine:** LLM-powered review (OpenAI `gpt-4o-mini` / Google Gemini `gemini-1.5-flash`) that replaces hollow tech clichés, superlatives, and hyperbole with credible, professional phrasing.
- **Strict Evidence Attribution:** Suggestions explicitly link to configured guidelines or are honestly labeled as *"AI Suggestion (No verified policy evidence)"*.
- **Prompt Injection Defense:** Strict XML delimiter boundaries `<UNTRUSTED_DRAFT_CONTENT>` isolate untrusted copy from system directives.
- **Fail-Safe Unavailable States:** If API keys are unconfigured, safely reports `status: 'unavailable'` with helpful setup instructions rather than fabricating fake output.

### C. Multimodal Creative & Accessibility Compliance
- **Image & Logo Ingestion:** Validates PNG, JPEG, and WEBP assets up to 4 MB with client-side canvas preparation (capping dimensions to 1600px to avoid token overflow).
- **In-Memory Sample Creative Asset:** 1-click **"Draft + Creative Logo"** generates a high-contrast BrandGuard AI emblem and banner with zero external network dependencies.
- **Author Alt-Text Verification:**
  - Evaluates screen reader descriptions for accessibility compliance.
  - Automatically flags missing alt-text with Medium severity.
  - Flags non-descriptive generic placeholders (e.g., `"image"`, `"photo"`, `"logo"`) with actionable remedies.
- **Visual Evidence Distinction:** Findings visibly distinguish verified observable evidence from uncertain visual judgments (`isUncertain: true`).

### D. Governance, Role Enforcement & Review State Machine
- **Strict Role Permissions (RBAC):**
  - **Editor:** Create/edit drafts, run compliance checks, request reviews, export data. Strictly barred from approving, rejecting, or publishing.
  - **Reviewer:** Execute editorial decisions (`Approve`, `Request Changes`, `Reject`), provide decision notes, and dispatch approved publishing webhooks.
  - **Admin:** Complete authority over brand profiles, rule configuration, team reviews, and publishing integrations.
- **Deterministic Review State Transitions:**
  - `Draft` $\rightarrow$ `Needs review` | `In review`
  - `Needs review` $\rightarrow$ `In review` | `Approved` | `Changes Requested` | `Rejected`
  - `Changes Requested` $\rightarrow$ `Needs review` | `In review`
  - `Approved` $\rightarrow$ `Published` (or re-evaluation)
  - `Published` $\rightarrow$ *Terminal state* (repeated publishing blocked with HTTP 409)
- **Gated Publishing:** Content cannot be published from `Draft`, `Needs review`, `In review`, `Changes Requested`, or `Rejected` states. Explicit human approval (`Approved`) is mandatory.

### E. Publishing Webhooks & Integration Security
- **Serverless API Route (`POST /api/publish`):** Validates Bearer authentication, checks authoritative database roles, verifies database approval state, and prevents repeated dispatches.
- **SSRF Protection:** Rejects private IP ranges, loopback addresses (`127.0.0.1`, `localhost`), link-local IPs, cloud metadata endpoints (`169.254.169.254`), and non-HTTPS URLs in production.
- **HMAC-SHA256 Signatures:** Webhook payloads are signed using server-side secrets (`X-BrandGuard-Signature: sha256=...`).
- **Secret Protection:** Signing secrets are kept strictly server-side and never exposed to client bundles.
- **Idempotency Guarantee:** Stable keys (`pub_<reviewId>_<hash>`) are reused across retries to prevent duplicate downstream publications.
- **Simulated Demo Mode:** Offline publishing simulation enables full demonstration without external CMS credentials, visibly labeled as `SIMULATED DEMO DELIVERY`.

### F. Analytics & Storage Transparency
- **Historical Integrity:** First-pass issues count and compliance score remain immutable across subsequent edits.
- **Organizational Insights:** Computes pass rates, channel risk distributions, and recurring rule violation aggregates from saved review histories.
- **Storage Transparency Disclosure:** Honestly disclaims browser `LocalStorage` demo mode vs. enterprise PostgreSQL ledger with Row-Level Security.

---

## 3. Architecture & Implementation Summary

```
                                +-----------------------------------------------------+
                                |                  Client Browser                     |
                                |       React 19 + TypeScript + Vite + Tailwind/CSS   |
                                +--------------------------+--------------------------+
                                                           |
                          +--------------------------------+--------------------------------+
                          |                                                                 |
           (Deterministic Rule Engine)                                            (Serverless Handlers)
                          |                                                                 |
            src/services/ruleEngine.ts                                    netlify/functions/ or Vite dev
                          |                                                                 |
            - Math-based rule evaluation                              +---------------------+---------------------+
            - Punctuation & casing normalization                      |                     |                     |
            - Severity deduction formula                              v                     v                     v
            - Fast, zero-hallucination                     /api/ai-tone-review   /api/multimodal-review   /api/publish
                                                                      |                     |                     |
                                                        OpenAI / Gemini Vision  OpenAI / Gemini Vision  Authoritative Review
                                                        (Server Env Keys)       (MIME & 4MB Capped)     & Webhook Dispatch
                                                                      |                     |                     |
                                                                      +---------------------+---------------------+
                                                                                            |
                                                                                            v
                                                                                PostgreSQL on Supabase
                                                                                (schema.sql & RLS Policies)
```

---

## 4. Status of Three Round 2 Commitments

In the Round 2 submission, three primary enhancements were committed for Round 3. Here is the verified implementation status of each:

| # | Round 2 Commitment | Target Scope | Current Status | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Multi-Modal Visual Asset Inspection** | Automated image upload analysis, logo clear space, WCAG contrast, and alt-text verification. | **COMPLETED** | - `src/services/multimodalReview.ts` & `src/services/multimodalServerHandler.ts`<br>- Tested in `multimodalReview.test.ts` (22 tests passing)<br>- Live API endpoint verified: `POST /api/multimodal-review` returned HTTP 200 with OpenAI vision findings<br>- In-memory sample creative generator with zero external dependencies. |
| **2** | **Enterprise RBAC & Department Routing** | Creator (Editor) vs. Reviewer vs. Admin roles, access controls, and simulated personas. | **COMPLETED** | - `src/services/rbac.ts` & `src/services/reviewTransitions.ts`<br>- Permission matrix enforced in UI and server storage layer<br>- Tested in `governanceWorkflow.test.ts` (26 tests passing)<br>- Editor barred from approving/publishing; simulated demo personas clearly labeled. |
| **3** | **Direct Publishing Webhooks & CMS Integrations** | 1-click publishing pipelines with HMAC signatures, idempotency, and human approval gating. | **COMPLETED** | - `src/services/publishingHandler.ts` & `netlify/functions/publish.ts`<br>- Tested in `publishingHandler.test.ts` & `publishingService.test.ts`<br>- SSRF protection, HMAC-SHA256 signatures, repeated publish blocking (HTTP 409)<br>- Offline demo simulation with transparent labeling. |

---

## 5. Tests Performed & Actual Results

### Automated Quality Checks

```bash
# 1. Automated Test Suite (50 suites, 197 unit & integration tests)
npm test
# Result: 197 passed, 0 failed, 100% pass rate

# 2. Strict Static Analysis (oxlint on 73 files)
npm run lint
# Result: Found 0 warnings and 0 errors

# 3. TypeScript Compilation Check
npx tsc -b --noEmit
# Result: Clean exit (code 0), 0 type errors

# 4. Production Rollup Bundle
npm run build
# Result: Clean production bundle generated in 364ms
```

### Breakdown of Test Suites
- **Multimodal Visual & Alt-Text Tests (`multimodalReview.test.ts`):** 22 tests verifying MIME types, file size bounds (4 MB), empty data, prompt isolation, provider fallback (OpenAI to Gemini), alt-text evaluation, and placeholder alt-text detection.
- **AI Tone & Context Review Tests (`aiToneService.test.ts`):** 16 tests verifying rule attribution honesty, missing credentials handling, malformed JSON recovery, prompt injection defense, substantive rewrite verification, and secure Gemini headers.
- **Governance & State Transitions (`governanceWorkflow.test.ts`):** 26 tests verifying role permissions (Editor, Reviewer, Admin), valid lifecycle state transitions, unapproved publish blocking, duplicate submission prevention, and audit deduplication.
- **Server-Side Publishing Handler Tests (`publishingHandler.test.ts`):** 28 tests verifying cryptographic Bearer token verification, authoritative role lookup, SSRF defense, private IP filtering, idempotency key derivation, and HTTP 409 repeated publish guards.
- **End-to-End Publishing Service Tests (`publishingService.test.ts`):** 5 tests verifying client dispatch, 503 unconfigured handling, end-to-end judge workflow lifecycle, and storage rehydration.
- **Deterministic Rule Engine & Analytics Tests (`ruleEngine.test.ts`, `analytics.test.ts`):** 30+ tests verifying score determinism, casing insensitivity, punctuation handling, zero-division safety, and immutable first-pass scoring.

---

## 6. Distinguishing Automated, Local Demo, and Live Verification

To maintain complete transparency for hackathon judges, verification tiers are explicitly separated:

| Tier | Environment | Features Verified | Evidence / Method |
| :--- | :--- | :--- | :--- |
| **Automated Verification** | Local CI / Node.js test runner | 197 tests covering all state transitions, RBAC matrices, SSRF guards, HMAC signatures, prompt security, and nullability mapper contracts. | `npm test`, `npm run lint`, `npx tsc -b --noEmit`, `npm run build` |
| **Local Demo Verification** | `localhost:5173` (Vite dev server) | Full UI experience, simulated demo persona switching (Admin, Reviewer, Editor), in-memory canvas sample creative generation, 1-click draft population, and offline demo publishing simulation. | Tested and confirmed via browser dev server and local storage rehydration. |
| **Live Production Verification** | `https://buildguardai.netlify.app/` | Netlify edge delivery, live `/api/ai-tone-review` (OpenAI `gpt-4o-mini`), and live `/api/multimodal-review` (OpenAI vision inspection). | Verified via live HTTP/2 cURL requests returning genuine structured findings from production Netlify functions. |

---

## 7. Known Limitations & Transparency Disclosures

1. **Simulated Demo Personas vs. SSO:** The UI persona switcher enables judges to toggle between Admin, Reviewer, and Editor roles client-side. Authentic enterprise authorization requires logging in with authentic Supabase Auth credentials backed by the server `user_roles` table.
2. **Local Storage Demo Mode:** When running without a live Supabase cloud database connection, records are stored in browser `LocalStorage`. While lifecycle transitions are strictly enforced in client memory, browser storage is not a cryptographically tamper-proof ledger. Authoritative immutability requires Cloud PostgreSQL with Row-Level Security.
3. **Live Webhook Dispatch Configuration:** Live webhook dispatches via `/api/publish` require server environment variables (`PUBLISHING_WEBHOOK_URL`, `PUBLISHING_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`). For evaluation without external CMS webhooks, the **Offline Demo Simulation** provides complete workflow verification.
4. **Sandboxed Automated Browser Driver:** Headless Playwright browser automation in network-isolated sandboxes may encounter driver download restrictions (`404 Not Found` from external driver CDNs); manual browser navigation and live endpoint tests confirm 100% operational status.

---

## 8. Setup Instructions (Cloning & Running Locally)

### Prerequisites
- Node.js 20+ (recommended v22+)
- npm 10+

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/emmanuelkeys789/brandguard-ai.git
cd brandguard-ai

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables
# Copy .env.example to .env to configure Supabase or OpenAI/Gemini keys.
# If omitted, BrandGuard AI runs in full local demo mode with deterministic rules.
cp .env.example .env

# 4. Run automated test suite
npm test

# 5. Start development server
npm run dev
# Open http://localhost:5173/ in your browser
```

---

## 9. 2-Minute Judge Walkthrough Script

Follow these steps to evaluate the complete BrandGuard AI workflow:

1. **Launch Workspace:** Open the application and navigate to the **Check Content** tab.
2. **Load Sample Creative & Copy:** Click the blue **"Draft + Creative Logo"** button at the top of the form. This populates both the marketing draft (with deliberate superlatives) and the in-memory BrandGuard creative banner with accessibility alt-text.
3. **Execute Evaluation:** Click **"Run Content Check"**.
4. **Inspect Tri-Stream Findings:**
   - **Policy Violations Tab:** Inspect deterministic findings flagging unsupported claims (*"undisputed #1"*, *"100% immunity"*).
   - **AI Tone Suggestions Tab:** Inspect contextual voice critique and review substantive rewrite options.
   - **Visual Compliance Tab:** Inspect creative asset checks, observable evidence callouts, and alt-text verification.
5. **Apply Remediation:** Click **"Apply to Draft"** on the suggested corrections to observe instant draft textarea updates.
6. **Submit for Editorial Review:** Click **"Save Review to Past Reviews"** (or **"Submit Draft for Review"**).
7. **Inspect Governance & Approval:** Navigate to **Past Reviews**, select the submitted draft, and observe that publishing is **Gated** until approved.
8. **Signoff & Publish:**
   - Ensure active persona is **Reviewer** or **Admin**.
   - Click **"Approve"** and add a signoff note.
   - Inspect the unlocked publishing section, open **"Inspect Webhook Payload & Signature"** to review the signed payload, and click **"Simulate Webhook Delivery (Offline Demo)"**.
   - Observe the `SIMULATED DEMO DELIVERY` badge and note that repeated publishing is safely prevented.

---
*BrandGuard AI — Advanced Agentic Brand Governance & Compliance Platform*
