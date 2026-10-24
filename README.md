# BrandGuard AI — Autonomous Brand Governance Platform

> **Hackathon Round 2 Submission**  
> Enterprise pre-publication brand compliance engine with deterministic rule evaluations, editorial review workflows, audit traceability, and hybrid cloud persistence.

---

## 1. Executive Summary

**BrandGuard AI** is a brand governance platform designed for cross-functional marketing, legal, and regulatory compliance teams. It intercepts marketing and communications copy prior to publication, checks drafts against computable brand rules, flags prohibited claims or voice violations with exact text citations, and maintains a strict human-in-the-loop review workflow.

### Core Capabilities
- **Deterministic Rule Engine:** Evaluates draft copy against configured brand guardrails (unsupported superlatives, prohibited terminology, mandatory legal disclaimers, and tone).
- **Human Review & Revision Workflow:** Side-by-side comparison of locked original drafts against editable revised versions with instantaneous re-evaluation upon editing.
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

---

## 3. Quick Start & Local Development

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)

### Setup Commands

```bash
# 1. Clone repository & install dependencies
git clone <repository-url>
cd "code axis project"
npm install

# 2. Run automated test suite (50 passing unit tests)
npm test

# 3. Run linter (0 errors, 0 warnings)
npm run lint

# 4. Run production build
npm run build

# 5. Start development server
npm run dev
```

The app will be available locally at `http://localhost:5173/`.

---

## 4. Storage Architecture: Local-First with Supabase Cloud Sync

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
   - When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided in `.env`, the repository pings the database and rehydrates state from cloud PostgreSQL tables.
   - All saves, edits, approvals, and deletions upsert directly into PostgreSQL.
   - Includes 1-click **"Sync Local Data to Database"** to migrate local records without duplicate entries.

---

## 5. Supabase Database Setup Guide

To connect BrandGuard AI to a live Supabase PostgreSQL instance:

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.

### Step 2: Run Database Schema
1. In the Supabase project dashboard, open the **SQL Editor** on the left menu.
2. Open `supabase/schema.sql` from this repository, paste the entire SQL content into the SQL Editor, and click **Run**.
3. Verify that three tables are created:
   - `brand_profiles`: Enterprise brand identity and tone settings.
   - `brand_rules`: Computable brand guardrails and policy citations.
   - `brand_reviews`: Locked original drafts, revised drafts, JSONB findings, JSONB decision history, and first-pass metrics.

### Step 3: Configure Environment Variables
1. In Supabase, navigate to **Project Settings** -> **API**.
2. Copy your **Project URL** and **anon / public** API key.
3. In the project root, create a file named `.env` (copied from `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Restart the Vite dev server (`npm run dev`).
5. In BrandGuard AI, navigate to **Settings** -> **Storage Backend & Database**, verify the green **"Connected to Supabase PostgreSQL"** status badge, and click **"Sync Local Data to Database"**.

---

## 6. Security & Row Level Security (RLS) Disclosure

- **Zero Secret Key Exposure:** Frontend code only accesses the public anonymous key (`VITE_SUPABASE_ANON_KEY`). The service-role key is never included or exposed.
- **Ignored Secrets:** `.gitignore` explicitly prevents `.env` and `.env.*` files from being committed. Only `.env.example` is tracked.
- **Row Level Security (RLS):**
  - RLS is explicitly enabled on all database tables in `supabase/schema.sql`.
  - **Demo Posture Limitation:** Because this hackathon project currently features an open workspace without user authentication, the default RLS policies allow the anonymous role (`anon`) to read and upsert workspace records.
  - **Production Roadmap:** For multi-tenant enterprise production, user authentication (e.g. Supabase Auth via `auth.uid()`) must be integrated to restrict table reads/writes strictly to authorized organization tenant IDs.

---

## 7. Public Deployment Configuration (Vercel & Netlify)

The project is pre-configured for single-page application (SPA) deep linking and direct page refreshes:

- **Build Command:** `npm run build` (or `tsc -b && vite build`)
- **Output Directory:** `dist`
- **Vercel SPA Rewrites:** Configured in `vercel.json` (`/(.*) -> /index.html`).
- **Netlify SPA Redirects:** Configured in `public/_redirects` (`/* /index.html 200`).
- **Environment Variables for Production Deployment:**
  - In Vercel / Netlify dashboard, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as production environment variables (optional; app automatically defaults to LocalStorage fallback if omitted).

---

## 8. Verification & Test Suite

All 50 unit and integration tests execute in ~320ms using Node.js:

```bash
$ npm test

▶ Database Repository & Data Mappers Tests
  ▶ PostgreSQL Row Mappers (3 tests passed)
  ▶ Offline & Unconfigured Environment Handling (7 tests passed)
  ▶ Mocked Supabase Operations & Remote Error Surfacing (7 tests passed)
✔ Database Repository & Data Mappers Tests (48ms)
▶ Trends & Insights Analytics Tests (8 tests passed)
▶ Human Review and Approval Workflow Tests (17 tests passed)
▶ Deterministic Rule Engine Tests (8 tests passed)

ℹ tests 50
ℹ suites 7
ℹ pass 50
ℹ fail 0
```

Lint and build validations:
```bash
$ npm run lint
Found 0 warnings and 0 errors.

$ npm run build
dist/assets/vendor-icons.js      24.59 kB │ gzip:  8.68 kB
dist/assets/vendor-react.js      210.91 kB │ gzip: 65.85 kB
dist/assets/vendor-supabase.js   214.38 kB │ gzip: 55.16 kB
dist/assets/index.js             269.94 kB │ gzip: 52.94 kB
✓ built in 372ms
```
