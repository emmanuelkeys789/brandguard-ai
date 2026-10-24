# BrandGuard AI — Autonomous Brand Governance Platform

> **Hackathon Round 2 Submission**  
> Enterprise pre-publication brand compliance engine with deterministic rule evaluations, genuine AI tone & contextual messaging audits, human-in-the-loop review workflows, audit traceability, and hybrid cloud persistence.
> 
> **Live Deployment:** [https://buildguardai.netlify.app/](https://buildguardai.netlify.app/)  
> **GitHub Repository:** [https://github.com/emmanuelkeys789/brandguard-ai](https://github.com/emmanuelkeys789/brandguard-ai)

---

## 1. Executive Summary

**BrandGuard AI** is a brand governance platform designed for cross-functional marketing, legal, communications, and regulatory compliance teams. It intercepts marketing and communications copy prior to publication, checks drafts against computable brand rules and AI contextual tone models, flags prohibited claims or voice violations with exact text citations, and maintains a strict human-in-the-loop review workflow.

### Core Capabilities
- **Deterministic Rule Engine:** Evaluates draft copy against configured brand guardrails (unsupported superlatives, prohibited terminology, mandatory legal disclaimers, trademark casing, and approved facts).
- **Genuine AI Tone & Context Review:** Secure server-side LLM analysis (OpenAI / Gemini) auditing draft tone, voice consistency, audience alignment, and messaging resonance against saved brand guidelines.
- **Strict Evidence Attribution & Hallucination Prevention:** Flags lacking genuine policy citations are explicitly designated as `"AI Suggestion (No verified policy evidence)"`. Never fabricates policies, guidelines, or citations.
- **Untrusted Draft Isolation:** User draft input is enclosed in `<UNTRUSTED_DRAFT_CONTENT>` data boundaries with strict anti-prompt-injection directives.
- **Human Review & Revision Workflow:** Side-by-side comparison of locked original drafts against editable revised versions with instantaneous re-evaluation upon editing. AI suggestions are optional and editable; AI never automatically approves, rejects, or publishes.
- **Immutable Audit Trail:** Retains immutable first-pass violation counts and scores to track genuine organizational compliance velocity across subsequent draft revisions.
- **Audit Export:** Export complete historical audit trails and reviewer decisions as formatted CSV.
- **Portfolio Trends & Insights:** Aggregates recurring policy violations and channel compliance rates computed directly from audited review data.
- **Hybrid Local-First Storage Architecture:** Works out-of-the-box in offline LocalStorage mode, and seamlessly connects to Supabase PostgreSQL when credentials are provided.

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript 6.0, Vite 8.3
- **Styling:** Custom Vanilla CSS Design System with dark liquid-glass aesthetics, frosted glassmorphism, and neon lime accents (`#D6FF70`)
- **Icons:** `lucide-react` (isolated vendor bundle)
- **Testing:** Native Node.js test runner (`node:test`, `node:assert/strict`) with zero runtime overhead
- **Linter:** Oxlint (`oxlint`) — sub-100ms multi-threaded static analysis
- **Database / Backend:** Supabase PostgreSQL (`@supabase/supabase-js` v2) with Row Level Security (RLS)
- **Serverless / Edge Functions:**
  - Netlify Functions v2 (`netlify/functions/ai-tone-review.ts`)
  - Vercel Serverless Functions (`api/ai-tone-review.ts`)
  - Supabase Edge Functions (`supabase/functions/ai-tone-review/index.ts`)
  - Local Vite Dev Middleware proxy (`vite.config.ts`)

---

## 3. Quick Start & Local Development

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)

### Setup Commands

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/emmanuelkeys789/brandguard-ai.git
cd "brandguard-ai"
npm install

# 2. Run automated test suite (60 passing unit & integration tests)
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

## 4. Architecture & Security: AI Tone Review & Rule Engine

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

## 6. Environment Variables Configuration

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

## 7. Public Deployment (Netlify & Vercel)

BrandGuard AI is deployed live at **[https://buildguardai.netlify.app/](https://buildguardai.netlify.app/)**.

- **Netlify Configuration:**
  - Build command: `npm run build`
  - Publish directory: `dist`
  - SPA Rewrites: Configured in `public/_redirects` (`/* /index.html 200`) and `netlify.toml`.
  - Functions: `netlify/functions/ai-tone-review.ts` automatically serves `POST /api/ai-tone-review`.
- **Vercel Configuration:**
  - Configured in `vercel.json` and `api/ai-tone-review.ts`.

---

## 8. Verification & Test Suite

All 60 unit and integration tests execute in ~440ms using native Node.js:

```bash
$ npm test

▶ AI Tone & Context Review Tests
  ▶ 1. Schema Validation & Policy Evidence Attribution (3 tests passed)
  ▶ 2. Missing Credentials & Provider Unavailable Handling (2 tests passed)
  ▶ 3. Malformed AI Output & Network Error Handling (2 tests passed)
  ▶ 4. Prompt Injection & Untrusted Input Isolation (1 test passed)
  ▶ 5. Separation of AI Suggestions from Deterministic Rule Engine (2 tests passed)
✔ AI Tone & Context Review Tests (25ms)
▶ Database Repository & Data Mappers Tests
  ▶ PostgreSQL Row Mappers (3 tests passed)
  ▶ Offline & Unconfigured Environment Handling (7 tests passed)
  ▶ Mocked Supabase Operations & Remote Error Surfacing (7 tests passed)
✔ Database Repository & Data Mappers Tests (51ms)
▶ Trends & Insights Analytics Tests (8 tests passed)
▶ Human Review and Approval Workflow Tests (17 tests passed)
▶ Deterministic Rule Engine Tests (8 tests passed)

ℹ tests 60
ℹ suites 13
ℹ pass 60
ℹ fail 0
```

Lint and build validations:
```bash
$ npm run lint
Found 0 warnings and 0 errors.
Finished in 83ms on 51 files with 116 rules using 8 threads.

$ npm run build
dist/assets/vendor-icons.js      25.05 kB │ gzip:  8.84 kB
dist/assets/vendor-react.js      210.91 kB │ gzip: 65.85 kB
dist/assets/vendor-supabase.js   214.38 kB │ gzip: 55.16 kB
dist/assets/index.js             299.48 kB │ gzip: 58.53 kB
✓ built in 394ms
```

---

## 9. Reserved Features for Round 3

In adherence to Round 2 hackathon scope and stability mandates, the following features are intentionally reserved for Round 3:
1. **Uploaded-Image & Visual Brand Asset Inspection:** Multi-modal analysis of uploaded raster/vector logos, color contrast ratios in images, and automated alt-text generation.
2. **Enterprise Role-Based Access Control (RBAC):** Organization-level creator vs. reviewer permissions, SSO integration, and multi-tenant department routing.
3. **Automated Publishing Webhooks:** Integrations to publish approved copy directly to CMS or social channels.
