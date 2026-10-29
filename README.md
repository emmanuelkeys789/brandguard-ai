# BrandGuard AI — Autonomous Brand Governance Platform

> **Round 3 Final Submission — Deployment & Live Verification**  
> Enterprise pre-publication brand compliance engine featuring deterministic policy rule evaluations, genuine server-side AI tone audits, multimodal visual asset & logo inspection, role-based governance with human-in-the-loop approvals, and secure publishing webhooks.
>
> - **Live Deployed Application:** [https://buildguardai.netlify.app/](https://buildguardai.netlify.app/)
> - **Source Code Repository:** [https://github.com/emmanuelkeys789/brandguard-ai](https://github.com/emmanuelkeys789/brandguard-ai)
> - **Round 3 Documentation PDF:** [`docs/BrandGuard_AI_Round_3_Submission.pdf`](docs/BrandGuard_AI_Round_3_Submission.pdf)

---

## 1. Product Purpose & Executive Summary

Modern enterprise marketing, communications, and product teams publish high volumes of omnichannel content across email, social, blogs, paid ads, and technical documentation. Organizations face three compounding governance challenges:
1. **Manual Compliance Bottlenecks:** Human legal and brand reviews are slow and expensive, creating publication friction and inconsistent policy enforcement.
2. **Regulatory & Brand Reputation Risk:** Unchecked drafts lead to prohibited claims, unverified guarantees, missing legal disclaimers, trademark casing errors, and accessibility failures.
3. **Unreliable Pure-LLM Hallucinations:** Pure LLMs often hallucinate rules, conflate stylistic suggestions with binding corporate policy, and cannot be trusted for deterministic compliance or unassisted autonomous publishing.

**BrandGuard AI** solves these challenges by combining **computable deterministic rule evaluation** with **server-side AI tone analysis**, **multimodal visual asset inspection**, **strict role-based human governance**, and **cryptographically secured publishing pipelines**.

---

## 2. Complete Feature List

### Core Brand & Policy Engine
- **Deterministic Rule Validation:** Millisecond-level regex and algorithmic evaluation of prohibited terms, unverified superlatives, absolute guarantees, and missing mandatory disclaimers.
- **Trademark & Casing Enforcement:** Identifies improper casing of brand terms and product names (e.g., "brandguard ai" vs. "BrandGuard AI").
- **Exact Substring Highlighting:** Direct character-level mapping from rule violation to draft text for transparent reviewer audit.
- **Configurable Brand Profiles:** Customizable brand voice guidelines, industry compliance rules (FTC, HIPAA, Financial), approved facts, and audience targets.

### Multimodal Visual & Logo Inspection (Round 3)
- **Visual Asset Upload & Live Preview:** Supports JPEG, PNG, WebP, SVG, and GIF image inspection up to 8MB.
- **Built-in Sample Creative:** 1-click **"Load Sample Creative Asset"** generates a high-contrast in-memory SVG badge (`BrandGuard Enterprise Suite`) with zero external network dependencies.
- **Accessibility & Alt-Text Audit:** Automatically evaluates alt-text presence, length, and descriptive quality against WCAG 2.1 AA best practices.
- **Multimodal AI Provider:** Serverless endpoint (`/api/multimodal-review`) leveraging OpenAI Vision (`gpt-4o-mini`) or Google Gemini Vision (`gemini-1.5-flash`).
- **Resilient Fallback & Transparency:** If external AI providers are unconfigured or unreachable, the system executes deterministic image metadata/contrast/alt-text checks and clearly badges the result as `Deterministic Rule Fallback` (never inventing AI responses).

### AI Voice & Tone Analysis
- **Server-Side LLM Audits:** Evaluates brand voice alignment, audience resonance, readability, and hyperbole.
- **Prompt Injection Boundaries:** Encapsulates draft copy within strict `<UNTRUSTED_DRAFT_CONTENT>` XML boundaries to prevent prompt manipulation.
- **1-Click Substantive Rewrites:** Reviewers can click **"Apply to Draft"** to instantly patch phrasing while preserving the immutable original draft.
- **Separation of Policy vs. Advisory AI:** Deterministic findings strictly govern the numeric compliance score (`0–100`); advisory AI tone suggestions never alter the score.

### Enterprise Governance & Workflow (Round 3)
- **Role-Based Access Control (RBAC):** Three distinct personas with full UI and persistence enforcement:
  - **Editor:** Can create, edit, run checks, and submit drafts for review. Strictly forbidden from approving, rejecting, or publishing.
  - **Reviewer:** Can audit findings, request changes, add reviewer feedback, and approve clean drafts. Forbidden from publishing.
  - **Admin:** Full governance authority including policy configuration, final approvals, overrides, and publishing authorization.
- **Explicit Persona Switching:** Header role selector with unambiguous badge: `SIMULATED PERSONA FOR JUDGING / DEMO`.
- **Review State Machine:** Validated lifecycle transitions (`draft` → `in_review` → `approved` / `changes_requested` / `rejected` → `published`).
- **Immutable Audit Trail:** Original draft content and first-pass compliance score remain permanently frozen to track improvement across revision cycles.

### Secure Publishing Pipelines (Round 3)
- **Hard Approval Gating:** Publishing is strictly blocked in both client UI and server API unless the review is in `approved` status.
- **Cryptographic Webhooks:** HMAC-SHA256 payload signature (`X-BrandGuard-Signature: sha256=...`) and millisecond timestamp header (`X-BrandGuard-Timestamp`) to prevent replay attacks.
- **SSRF & Security Defense:** Internal IP rejection (`127.0.0.1`, `localhost`, `10.0.0.0/8`, `169.254.0.0/16`), HTTPS enforcement in production, and 10-second timeout.
- **Offline Simulation Transparency:** When webhook endpoints are not configured or the network is offline, publishing executes a safe local simulation clearly labeled: `Simulation: Offline Demo Mode (Mock Publish - No External Webhook Triggered)`.
- **Duplicate Publish Prevention:** Idempotent publish tracking prevents repeated re-publishing (HTTP 409 Conflict).

### Persistence & Storage Transparency
- **Hybrid Local-First Architecture:** Operates out-of-the-box in browser `localStorage` and syncs seamlessly with Supabase PostgreSQL when cloud credentials are provided.
- **Persistence Indicator:** Header status badge explicitly indicates whether the session is running in `LocalStorage Mode (Offline Ready)` or `Supabase Cloud Connected`.
- **Audit Export:** 1-click CSV audit export of historical reviews, compliance scores, and approval records.

---

## 3. Status of Round 2 Commitments

In Round 2, the team committed to three specific improvements for Round 3. Here is the verified status of each:

| # | Round 2 Commitment | Status | Implementation Details & Evidence |
| :--- | :--- | :---: | :--- |
| **1** | **Multi-Modal Visual Asset Inspection** | **COMPLETED** | - Dedicated `multimodalReview.ts` service and serverless handler `multimodalServerHandler.ts`.<br>- Built-in SVG creative sample generator (`sampleCreativeAsset.ts`).<br>- Alt-text accessibility validator (`validateAltText`).<br>- Real OpenAI `gpt-4o-mini` Vision / Gemini 1.5 Flash endpoint (`/api/multimodal-review`).<br>- 22 automated tests passing in `multimodalReview.test.ts`. |
| **2** | **Enterprise RBAC & Department Routing** | **COMPLETED** | - RBAC permission matrix in `rbac.ts` and transition engine `reviewTransitions.ts`.<br>- Distinct `Editor`, `Reviewer`, and `Admin` personas with persistent simulated switching.<br>- Hard UI and storage-level guards preventing Editors from approving/publishing.<br>- Review history filters, status badges, and rejection note logging.<br>- 26 automated tests passing in `rbac.test.ts` and `reviewTransitions.test.ts`. |
| **3** | **Direct Publishing Webhooks & CMS Integrations** | **COMPLETED** | - Publishing service `publishingService.ts` and server handler `publishingHandler.ts`.<br>- HMAC-SHA256 signature verification and SSRF private IP blocker.<br>- Strict approval gating (HTTP 400/403 if status != `approved`).<br>- Idempotent duplicate publish guard (HTTP 409 Conflict).<br>- Clear offline simulation badge for demo safety.<br>- 23 automated tests passing in `publishing.test.ts`. |

---

## 4. Architecture & System Design

```
                                  +-------------------------------------------------------------+
                                  |                 BrandGuard AI Client (Vite/React)           |
                                  |  - Deterministic Policy Engine      - Multimodal Asset UI   |
                                  |  - Persona Switcher (RBAC)          - Locked Original Draft |
                                  |  - Review State Lifecycle           - Gated Publish Action  |
                                  +-------------------------------------------------------------+
                                                 |                          |
                         +-----------------------+                          +-----------------------+
                         | (Local Sync / Storage)                                                   | (Serverless API Calls)
                         v                                                                          v
        +-----------------------------------+                             +-----------------------------------+
        |       brandRepository.ts          |                             |   Serverless Backend Endpoints    |
        | - Browser LocalStorage (Default)  |                             |   (Netlify / Vercel / Dev Server) |
        | - Supabase PostgreSQL (Cloud Sync)|                             +-----------------------------------+
        | - Immutable First-Pass Scores     |                                   |               |           |
        +-----------------------------------+                                   v               v           v
                                                              +--------------------+ +--------------------+ +--------------------+
                                                              | /ai-tone-review    | | /multimodal-review | | /publish           |
                                                              | - OpenAI gpt-4o    | | - OpenAI Vision    | | - Approval Guard   |
                                                              | - Prompt Isolation | | - Alt-Text Audit   | | - HMAC-SHA256 Sign |
                                                              | - Policy Alignment | | - Rule Fallback    | | - SSRF Blocker     |
                                                              +--------------------+ +--------------------+ +--------------------+
```

### Security & Secret Isolation
- **Client-Side Zero-Leakage:** Client bundles in `dist/` contain only `VITE_` prefixed public variables. Server keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLISHING_WEBHOOK_SECRET`) are strictly isolated to serverless functions.
- **SSRF Defense:** Webhook requests reject localhost, loopback (`127.0.0.1`), private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and AWS cloud metadata IP (`169.254.169.254`).
- **Prompt Injection Shield:** User-submitted drafts are wrapped in `<UNTRUSTED_DRAFT_CONTENT>` blocks with strict system prompts instructing LLMs never to execute embedded instructions.

---

## 5. Verification & Test Results

The BrandGuard AI test suite runs via native Node.js (`node:test`, `node:assert/strict`) with zero runtime test dependencies:

```bash
$ npm test
✔ Deterministic Rule Engine Tests (8 tests)
✔ Database Repository & Data Mappers Tests (17 tests)
✔ Human Review and Approval Workflow Tests (17 tests)
✔ Trends & Insights Analytics Tests (8 tests)
✔ AI Tone & Context Review Tests (18 tests)
✔ Multimodal Image & Visual Asset Tests (22 tests)
✔ Role-Based Access Control (RBAC) Tests (12 tests)
✔ Review State Machine Transitions Tests (14 tests)
✔ Direct Publishing Webhooks & CMS Integration Tests (23 tests)

ℹ tests 197
ℹ suites 50
ℹ pass 197
ℹ fail 0
```

### Static Analysis & TypeScript
```bash
$ npm run lint
Found 0 warnings and 0 errors.
Finished in 91ms on 73 files with 116 rules using 8 threads.

$ npx tsc -b --noEmit
# Exit code 0 (Clean TypeScript compilation)

$ npm run build
dist/assets/vendor-icons.js      25.05 kB │ gzip:  8.84 kB
dist/assets/vendor-react.js      210.91 kB │ gzip: 65.85 kB
dist/assets/vendor-supabase.js   214.38 kB │ gzip: 55.16 kB
dist/assets/index.js             312.42 kB │ gzip: 61.12 kB
✓ built in 364ms
```

---

## 6. Live vs. Local Verification

| Capability / Check | Local Dev Server (`localhost:5173`) | Live Deployed App (`buildguardai.netlify.app`) | Status & Notes |
| :--- | :---: | :---: | :--- |
| **Main Page Load** | HTTP 200 OK | HTTP/2 200 OK | **Verified:** Fast initial load, responsive UI. |
| **Sample Asset Loading** | Instant in-memory | Instant in-memory | **Verified:** Zero network dependency. |
| **Deterministic Rule Engine** | 100% Client-side | 100% Client-side | **Verified:** Flags prohibited claims & disclaimers. |
| **AI Tone Review API** | Live via Vite proxy | Live via Netlify Function | **Verified:** Returns real OpenAI `gpt-4o-mini` suggestions. |
| **Multimodal Review API** | Live via Vite proxy | Live via Netlify Function | **Verified:** Returns real OpenAI Vision findings & alt-text audit. |
| **Publishing Endpoint** | Live local handler | Offline simulation mode | **Verified:** Local endpoint returns signed JSON; live app gracefully simulates publish with clear label. |
| **RBAC Persona Enforcement** | Verified (Editor/Reviewer/Admin)| Verified (Editor/Reviewer/Admin)| **Verified:** Hard UI & state guards across all personas. |
| **Persistence Across Refresh** | Verified (localStorage) | Verified (localStorage) | **Verified:** Retains drafts, approvals, and reviews on reload. |

---

## 7. Known Limitations & Scope Transparency

In accordance with strict hackathon integrity guidelines:
- **Simulated Personas:** The user persona selector (Editor / Reviewer / Admin) is a simulated client identity tool designed for judge evaluation. Real SAML 2.0 / Okta SSO is documented on the future enterprise roadmap.
- **Live Netlify Serverless Sync:** The live Netlify deployment at `https://buildguardai.netlify.app/` runs the deployed frontend and active AI tone/multimodal functions. The newly added Round 3 publishing endpoint (`/api/publish`) is fully implemented in `netlify/functions/publish.ts` and passes all local tests; deploying it live to Netlify requires running `git push origin main` with repository write credentials.
- **Cloud Database Configuration:** The live production site defaults to `LocalStorage Mode (Offline Ready)`. Connecting a remote Supabase PostgreSQL database requires entering credentials in **Settings** or deploying environment variables.
- **Synchronous AI Timeout:** AI tone and visual requests execute synchronously with a 15-second `AbortController` timeout.

---

## 8. Quick Start & Setup Instructions

### Prerequisites
- **Node.js:** v20.x or v22.x
- **npm:** v10.x or higher

### Local Installation

```bash
# 1. Clone repository
git clone https://github.com/emmanuelkeys789/brandguard-ai.git
cd brandguard-ai

# 2. Install dependencies
npm install

# 3. Run all verification checks
npm test               # Runs all 197 native tests
npm run lint           # Static analysis with oxlint
npx tsc -b --noEmit    # TypeScript type-checking
npm run build          # Production bundle build

# 4. Start local development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Environment Configuration (Optional)
Copy `.env.example` to `.env` to configure external cloud services:

```bash
cp .env.example .env
```

Refer to [`.env.example`](.env.example) for documentation on setting `OPENAI_API_KEY`, `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, or `PUBLISHING_WEBHOOK_URL`.

---

## 9. 2-Minute Judge Walkthrough Script

Follow these steps to experience the complete BrandGuard AI Round 3 workflow:

1. **Open the Application:** Navigate to [https://buildguardai.netlify.app/](https://buildguardai.netlify.app/) (or `http://localhost:5173/`).
2. **Load Combined Draft & Creative Asset:**
   - In the **Review** tab, click **"Load Combined Sample Draft"** to populate sample text containing known policy violations.
   - Click **"Load Sample Creative Asset"** to generate the sample enterprise logo badge and populate alt-text.
3. **Run Pre-Publication Check:**
   - Click **"Run Compliance Check"**.
   - Inspect the **Deterministic Policy Rule Findings** tab: see exact substring citations for unverified superlatives and guarantees.
   - Inspect the **AI Tone Suggestions** tab: see substantive rewrites generated by OpenAI `gpt-4o-mini`.
   - Inspect the **Visual Asset & Logo Findings** tab: see contrast, clear-space, and alt-text audit results.
4. **Test Editor Role Restrictions:**
   - Switch persona to **Editor** in the top navigation bar.
   - Click **"Save & Submit for Review"** (status changes to `in_review`).
   - Notice that **Approve**, **Reject**, and **Publish** buttons are disabled with tooltip: *"Editors cannot approve/publish reviews."*
5. **Test Reviewer / Admin Approval:**
   - Switch persona to **Reviewer** (or **Admin**).
   - Enter reviewer notes and click **"Approve"**.
   - Review status updates to `approved`.
6. **Publishing & Offline Simulation:**
   - Notice that publishing was strictly blocked while the draft was in review.
   - Now that it is approved, click **"Publish Approved Content"**.
   - Verify the published dialog: clearly confirms publication with transparent labeling (`Offline Demo Simulation` or live webhook dispatch).
7. **Verify History & Audit Trail:**
   - Navigate to **Past Reviews**.
   - Verify the approved review appears in the audit list with its immutable first-pass score.
   - Use status filter buttons (`All`, `In Review`, `Approved`, `Published`) to inspect the records.
   - Click **"Export CSV Audit Log"** to verify audit export.

---

## 10. Repository & Documentation Assets

- **Submission PDF Document:** [`docs/BrandGuard_AI_Round_3_Submission.pdf`](docs/BrandGuard_AI_Round_3_Submission.pdf) (483 KB print-ready PDF)
- **Submission Markdown Source:** [`docs/BrandGuard_AI_Round_3_Submission.md`](docs/BrandGuard_AI_Round_3_Submission.md)
- **Submission HTML Source:** [`docs/BrandGuard_AI_Round_3_Submission.html`](docs/BrandGuard_AI_Round_3_Submission.html)
- **Environment Template:** [`.env.example`](.env.example)
- **Database Migrations:** [`supabase/migrations/`](supabase/migrations/)
