# BrandGuard AI — Autonomous Brand Governance Platform

> **Hackathon Round 2 Submission**  
> Enterprise pre-publication brand compliance engine with deterministic rule evaluations, genuine AI tone & contextual messaging audits, human-in-the-loop review workflows, audit traceability, and hybrid cloud persistence.
> 
> **Live Deployment:** [https://buildguardai.netlify.app/](https://buildguardai.netlify.app/)  
> **GitHub Repository:** [https://github.com/emmanuelkeys789/brandguard-ai](https://github.com/emmanuelkeys789/brandguard-ai)

---

## 1. Problem Statement

Modern marketing, communications, and product teams publish high volumes of content across diverse channels (email, social, blogs, paid ads, press releases). Organizations face three critical challenges:
1. **Manual Compliance Bottlenecks:** Human legal and brand reviews are slow, manual, and expensive, creating publication friction and inconsistent enforcement.
2. **Regulatory & Reputation Risk:** Unchecked drafts lead to prohibited claims, unverified guarantees, missing legal disclaimers, trademark misspellings, and brand voice erosion.
3. **Unreliable Pure-LLM Solutions:** Commercial LLMs often hallucinate policies, invent non-existent guidelines, act unpredictably without policy citations, and cannot be trusted for deterministic compliance enforcement or autonomous publishing.

---

## 2. Solution Overview

**BrandGuard AI** is a pre-publication brand governance platform that combines **computable deterministic rule validation** with **genuine server-side AI tone and context audits**. 

The system provides:
- **Instant Pre-Publication Checking:** Flags prohibited terms, unsupported superlatives, unverified guarantees, and casing errors against configurable brand rules with exact substring highlights.
- **Genuine AI Voice & Tone Analysis:** Server-side LLMs evaluate tone attributes, audience resonance, and messaging alignment against saved brand guidelines, generating substantive rewrites rather than superficial wording tweaks.
- **Side-by-Side Review & Substantive Rewrites:** A locked original draft view paired with an editable revised draft, featuring 1-click **"Apply to Draft"** intelligent replacement.
- **Human-in-the-Loop Governance:** Human reviewers maintain full authority to Approve, Request Changes, Reject, or Save Drafts. AI provides advisory suggestions but never auto-approves or auto-publishes.
- **Immutable First-Pass Audit Scoring:** Records original violation counts and initial scores alongside revised metrics to measure real compliance improvement over time.
- **Portfolio Trends & Insights:** Computes organizational compliance rates, channel performance, and top recurring violations from real audited review records.
- **Hybrid Local-First Storage:** Operates out-of-the-box in browser `localStorage` and syncs seamlessly with Supabase PostgreSQL when cloud credentials are provided.

---

## 3. Key Differentiators

| Capability | Standard LLM Tools | Legacy Rule Checkers | BrandGuard AI |
| :--- | :--- | :--- | :--- |
| **Deterministic Rule Enforcement** | ❌ Hallucinates & varies | ✅ Hardcoded regex only | ✅ **Computable brand rules with exact citations** |
| **Separation of Policy vs. Advisory AI** | ❌ Conflates rules & advice | ❌ No AI voice analysis | ✅ **Strict separation: AI never alters compliance score** |
| **Hallucination Prevention** | ❌ Invented rules & policies | N/A | ✅ **Strict policy attribution: unverified flags labeled advisory** |
| **Prompt Injection Defense** | ❌ Vulnerable to draft prompts | N/A | ✅ **`<UNTRUSTED_DRAFT_CONTENT>` boundary isolation** |
| **Draft Immutability & Audit Tracking**| ❌ Overwrites original copy | ❌ No revision tracking | ✅ **Locked original draft + immutable first-pass score** |
| **Substantive AI Rewrites** | ❌ Vague or repeated text | ❌ No rewrite suggestions | ✅ **1-Click Apply to Draft with substantive rewrites** |
| **Deployment Flexibility** | ❌ Vendor cloud lock-in | ❌ Local desktop only | ✅ **Zero-config LocalStorage + Supabase PostgreSQL sync** |

---

## 4. Technology Stack & Architecture

- **Frontend:** React 19, TypeScript 6.0, Vite 8.3
- **Styling:** Custom Vanilla CSS Design System with dark liquid-glass aesthetics, frosted glassmorphism, and neon lime accents (`#D6FF70`)
- **Icons:** `lucide-react` (isolated vendor bundle chunk)
- **Testing:** Native Node.js test runner (`node:test`, `node:assert/strict`) — 68 tests, zero runtime overhead
- **Linter:** Oxlint (`oxlint`) — sub-100ms multi-threaded static analysis (0 errors, 0 warnings across 51 files)
- **Database / Backend:** Supabase PostgreSQL (`@supabase/supabase-js` v2) with Row Level Security (RLS)
- **Serverless / Edge Functions:**
  - Netlify Functions v2 (`netlify/functions/ai-tone-review.ts`)
  - Vercel Serverless Functions (`api/ai-tone-review.ts`)
  - Supabase Edge Functions (`supabase/functions/ai-tone-review/index.ts`)
  - Local Vite Dev Middleware proxy (`vite.config.ts`)

```
                             +----------------------------------------+
                             |           BrandGuard AI Client         |
                             |  - Deterministic Policy Rule Engine    |
                             |  - Locked Original & Editable Draft    |
                             |  - Human Reviewer Decision Controls    |
                             +----------------------------------------+
                                         |                  |
                    (Deterministic Local)|                  | (Optional Async POST)
                                         v                  v
                        +-------------------+   +----------------------------+
                        | RuleEngine.ts     |   | /api/ai-tone-review        |
                        | - Approved Facts  |   | (Netlify/Vercel/Supabase)  |
                        | - Prohibited Terms|   +----------------------------+
                        | - Claims & Superl.|                |
                        | - Trademark Casing|                v (Server Secrets Only)
                        +-------------------+   +----------------------------+
                                                | Server-Side LLM Provider   |
                                                | - OpenAI gpt-4o-mini       |
                                                | - Google gemini-1.5-flash  |
                                                | - 15s AbortController      |
                                                | - <UNTRUSTED_DRAFT_CONTENT>|
                                                | - Evidence Verification    |
                                                +----------------------------+
```

### Deterministic vs. AI Separation
1. **Separation in UI:** Separate segmented switcher displays `Policy Rule Findings` (deterministic rule violations) vs. `AI Tone Suggestions` (advisory stylistic findings).
2. **Separation in Data Model:** Deterministic findings populate `review.findings` and strictly drive `confidenceScore`, `issuesCount`, and `firstPassScore`. AI suggestions populate `review.aiSuggestions` and never alter compliance scores.
3. **Editable Suggestions:** AI suggestions can be reviewed and applied to the revised draft with a single click (`Apply to Draft`), allowing the human reviewer to edit phrasing before rerunning checks.
4. **Authoritative Human Decisions:** AI never approves, rejects, or publishes drafts. Only human reviewers execute workflow decisions.

---

## 5. Storage Architecture: Local-First with Supabase Cloud Sync

BrandGuard AI implements a **Repository Pattern** (`brandRepository`) that decouples UI components from persistence mechanisms:

```
                           +---------------------------+
                           |     BrandGuard AI UI      |
                           +---------------------------+
                                         |
                                         v
                           +---------------------------+
                           |       BrandContext        |
                           +---------------------------+
                                   |           |
               (Optimistic Local)  v           v  (Async Persistence)
                           +--------------+ +--------------------+
                           | localStorage | |  brandRepository   |
                           +--------------+ +--------------------+
                                                      |
                                          +-----------+-----------+
                                          |                       |
                                          v (Unconfigured)        v (Configured)
                                    [Local Mode]          [Supabase PostgreSQL]
                                    - Offline ready       - brand_profiles
                                    - No remote errors    - brand_rules
                                    - Seed sample data    - brand_reviews (JSONB)
```

### Modes of Operation
1. **LocalStorage Mode (Default / Offline Ready):**
   - If no `.env` file or Supabase credentials exist, the application runs entirely in browser LocalStorage.
   - All reviews, brand guidelines, and profile configurations persist across refreshes.
   - The UI explicitly indicates `LocalStorage Mode (Offline Ready)` in **Settings**. It never pretends a cloud connection exists.
2. **Supabase PostgreSQL Mode (Configured):**
   - When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, the repository rehydrates state from cloud PostgreSQL tables.
   - All saves, edits, approvals, and deletions upsert directly into PostgreSQL.
   - Includes 1-click **"Sync Local Data to Database"** to migrate local records without duplicate entries.

---

## 6. Quick Start & Local Development

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)

### Setup Commands

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/emmanuelkeys789/brandguard-ai.git
cd "brandguard-ai"
npm install

# 2. Run automated test suite (68 passing unit & integration tests)
npm test

# 3. Run linter (0 errors, 0 warnings across 51 files)
npm run lint

# 4. Run production build
npm run build

# 5. Start development server
npm run dev
```

The app will be available locally at `http://localhost:5173/`.

---

## 7. Environment Variables Configuration

Refer to [`.env.example`](file:///Users/apple/Desktop/code%20axis%20project/.env.example) for exact templates.

### Public Client Environment Variables
```env
# Optional: Supabase PostgreSQL Cloud Database
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-api-key-here
```

### Server-Side AI Provider Secrets (Never prefix with `VITE_`)
```env
# Serverless / Edge Function Secrets:
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Alternative / Fallback Provider:
# GEMINI_API_KEY=AIza...
# GEMINI_MODEL=gemini-1.5-flash
```

> [!NOTE]
> When server AI credentials are not configured, BrandGuard AI safely reports `status: 'unavailable'` and guides the user on how to configure API keys. Deterministic checks continue operating with 100% functionality.

---

## 8. Public Deployment (Netlify & Vercel)

BrandGuard AI is deployed live at **[https://buildguardai.netlify.app/](https://buildguardai.netlify.app/)**.

- **Netlify Configuration:**
  - Build command: `npm run build`
  - Publish directory: `dist`
  - SPA Rewrites: Configured in `public/_redirects` (`/* /index.html 200`) and `netlify.toml`.
  - Functions: `netlify/functions/ai-tone-review.ts` automatically serves `POST /api/ai-tone-review`.
  - Live AI Provider: Configured with server-side OpenAI `gpt-4o-mini`.
- **Vercel Configuration:**
  - Configured in `vercel.json` and `api/ai-tone-review.ts`.

---

## 9. Verification & Test Suite

All 68 unit and integration tests execute in ~450ms using native Node.js:

```bash
$ npm test

▶ AI Tone & Context Review Tests
  ▶ 1. Schema Validation & Policy Evidence Attribution (3 tests passed)
  ▶ 2. Missing Credentials & Provider Unavailable Handling (2 tests passed)
  ▶ 3. Malformed AI Output & Network Error Handling (2 tests passed)
  ▶ 4. Prompt Injection & Untrusted Input Isolation (1 test passed)
  ▶ 5. Separation of AI Suggestions from Deterministic Rule Engine (2 tests passed)
  ▶ 6. Apply to Draft Workflow & Substantive Rewrite Verification (8 tests passed)
✔ AI Tone & Context Review Tests (37ms)
▶ Database Repository & Data Mappers Tests
  ▶ PostgreSQL Row Mappers (3 tests passed)
  ▶ Offline & Unconfigured Environment Handling (7 tests passed)
  ▶ Mocked Supabase Operations & Remote Error Surfacing (7 tests passed)
✔ Database Repository & Data Mappers Tests (36ms)
▶ Trends & Insights Analytics Tests (8 tests passed)
▶ Human Review and Approval Workflow Tests (17 tests passed)
▶ Deterministic Rule Engine Tests (8 tests passed)

ℹ tests 68
ℹ suites 14
ℹ pass 68
ℹ fail 0
```

Lint and production build validations:
```bash
$ npm run lint
Found 0 warnings and 0 errors.
Finished in 83ms on 51 files with 116 rules using 8 threads.

$ npm run build
dist/assets/vendor-icons.js      25.05 kB │ gzip:  8.84 kB
dist/assets/vendor-react.js      210.91 kB │ gzip: 65.85 kB
dist/assets/vendor-supabase.js   214.38 kB │ gzip: 55.16 kB
dist/assets/index.js             299.48 kB │ gzip: 58.53 kB
✓ built in 364ms
```

---

## 10. Honest Current Capabilities & Limitations

### Verified Current Capabilities
- **Deterministic Rule Checking:** Prohibited claims, unverified superlatives, trademark capitalization, and disclaimer omissions.
- **Genuine AI Tone & Voice Analysis:** Live OpenAI `gpt-4o-mini` evaluation returning structured severity, category, rationale, and substantive rewrites.
- **1-Click Apply to Draft:** Replaces flagged phrases in the active draft while preserving the original submitted draft for audit comparison.
- **Human-in-the-Loop Review Workflow:** Approve, Request Changes, Reject, or Save Drafts with reviewer notes and timestamps.
- **Immutable Historical Metrics:** Original draft content and first-pass compliance score remain immutable across all subsequent revision cycles.
- **Governance Analytics:** Live calculation of pass rates, channel risk, and recurring policy violations from saved reviews.
- **Zero-Crash Local Persistence:** Survives page refresh and offline sessions; supports direct CSV audit export.

### Transparent Limitations
- **Text-Only Content:** Round 2 evaluates text content (headlines, body copy, emails, ads). Visual logo rendering, image contrast, and raster asset inspection are not supported (reserved for Round 3).
- **Synchronous Serverless Execution:** AI tone requests execute synchronously with a 15-second AbortController timeout.
- **Single-Tenant Governance:** Reviewer workflows and approval states operate within the active organization workspace. Enterprise multi-tenant SSO and role-based ACLs are reserved for Round 3.
- **Advisory AI Boundaries:** AI suggestions are purely advisory and cannot override deterministic policy violations or bypass human review signoff.

---

## 11. Short Live Demo Script (2 Minutes)

Follow this 2-minute walkthrough to verify the complete BrandGuard AI workflow:

1. **Open Live App:** Visit [https://buildguardai.netlify.app/](https://buildguardai.netlify.app/).
2. **Inspect Brand Guidelines:**
   - Click the **Brand Profile** tab.
   - Observe configured voice attributes (*Professional, Confident, Objective*), prohibited terms (*"guaranteed 100%", "best in class"*), and mandatory disclaimers.
3. **Run Pre-Publication Check:**
   - Click the **Review** tab.
   - Enter the following sample draft into **Draft Content**:
     > *"BrandGuard AI is the absolute best compliance tool in human history. We guarantee 100% security with zero risk."*
   - Click **Run Compliance Check**.
   - Observe the deterministic engine flag violations for unsupported superlatives and unverified absolute guarantees with exact text citations.
4. **Inspect AI Voice & Tone Analysis:**
   - In the findings pane, switch to the **AI Tone Suggestions** tab.
   - Review the AI critique: notice the identified hyperbole and the substantive professional rewrite offered.
5. **Apply Substantive Rewrite:**
   - Click **Apply to Draft** on the suggestion.
   - Confirm the **Draft Content** textarea updates immediately with the professional phrasing.
   - Toggle **Show Original Draft** to confirm the initial draft is strictly preserved for audit comparison.
6. **Re-Run Evaluation & Human Signoff:**
   - Click **Rerun Check** on the revised draft.
   - Observe the compliance score increase to reflect the clean revised draft.
   - Click **Approve** (or **Request Changes**) and enter review notes.
7. **Verify Audit Trail & Analytics:**
   - Click **Past Reviews** to view the saved review record and its immutable first-pass score.
   - Click **Insights** to view aggregated organizational trends and channel compliance metrics.

---

## 12. Round 3 Roadmap

In strict adherence to Round 2 scope and reliability requirements, the following features are scheduled for Round 3:
1. **Multi-Modal Visual Asset Inspection:** Automated analysis of uploaded images, logo placement, clear-space detection, color contrast compliance (WCAG 2.1 AA), and automated alt-text generation.
2. **Enterprise RBAC & Department Routing:** Creator vs. Reviewer roles, SAML/Okta SSO authentication, and multi-department approval chains.
3. **Direct Publishing Webhooks & CMS Integrations:** 1-click publishing pipelines to HubSpot, WordPress, LinkedIn, and social media platforms upon final human approval.
