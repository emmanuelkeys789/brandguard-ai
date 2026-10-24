-- ========================================================================
-- BrandGuard AI — Cloud Governance Repository Schema
-- PostgreSQL on Supabase (Round 2 Hackathon Database Architecture)
-- ========================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------
-- 1. Table: brand_profiles
-- Organizational brand identity, baseline tone, and market context
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brand_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  target_audience TEXT DEFAULT '',
  communication_tone TEXT DEFAULT 'Professional' NOT NULL,
  tone_custom_details TEXT,
  preferred_language TEXT DEFAULT 'English (US)' NOT NULL,
  additional_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------
-- 2. Table: brand_rules
-- Computable brand guardrails and policy citations
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brand_rules (
  id TEXT PRIMARY KEY,
  brand_id TEXT REFERENCES brand_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium' NOT NULL,
  description TEXT NOT NULL,
  example TEXT,
  example_violation TEXT,
  remedy_recommendation TEXT,
  source_description TEXT,
  source_url TEXT,
  enabled BOOLEAN DEFAULT true NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------
-- 3. Table: brand_reviews
-- Immutable submitted drafts, revisions, findings, scores, and audit trails
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brand_reviews (
  id TEXT PRIMARY KEY,
  brand_id TEXT REFERENCES brand_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  author TEXT DEFAULT 'Workspace Reviewer' NOT NULL,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'Needs review' NOT NULL,
  updated_at_label TEXT DEFAULT 'Just now' NOT NULL,
  word_count INTEGER DEFAULT 0 NOT NULL,
  issues_count INTEGER DEFAULT 0 NOT NULL,
  confidence_score INTEGER DEFAULT 100 NOT NULL,
  summary TEXT DEFAULT '',
  original_draft TEXT NOT NULL,
  current_draft TEXT NOT NULL,
  rules_checked_count INTEGER DEFAULT 0 NOT NULL,
  first_pass_issues_count INTEGER,
  first_pass_score INTEGER,
  first_pass_findings JSONB DEFAULT '[]'::jsonb NOT NULL,
  findings JSONB DEFAULT '[]'::jsonb NOT NULL,
  decision_history JSONB DEFAULT '[]'::jsonb NOT NULL,
  revisions JSONB DEFAULT '[]'::jsonb NOT NULL,
  reviewer_comment TEXT,
  decision_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------
-- Indexes for Performance & Query Optimization
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_brand_rules_brand_id ON brand_rules(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_rules_category ON brand_rules(category);
CREATE INDEX IF NOT EXISTS idx_brand_rules_enabled ON brand_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_brand_id ON brand_reviews(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_status ON brand_reviews(status);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_channel ON brand_reviews(channel);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_created_at ON brand_reviews(created_at DESC);

-- ------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reviews ENABLE ROW LEVEL SECURITY;

-- Anonymous/Public access policies for Hackathon workspace demonstration
-- Allows frontend authenticated/anon client to read, insert, update, delete
CREATE POLICY "Allow public read on brand_profiles" ON brand_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on brand_profiles" ON brand_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on brand_profiles" ON brand_profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on brand_profiles" ON brand_profiles FOR DELETE USING (true);

CREATE POLICY "Allow public read on brand_rules" ON brand_rules FOR SELECT USING (true);
CREATE POLICY "Allow public insert on brand_rules" ON brand_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on brand_rules" ON brand_rules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on brand_rules" ON brand_rules FOR DELETE USING (true);

CREATE POLICY "Allow public read on brand_reviews" ON brand_reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert on brand_reviews" ON brand_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on brand_reviews" ON brand_reviews FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on brand_reviews" ON brand_reviews FOR DELETE USING (true);

-- ------------------------------------------------------------------------
-- Initial Baseline Data Seed
-- ------------------------------------------------------------------------
INSERT INTO brand_profiles (
  id, name, description, industry, target_audience, communication_tone, preferred_language, additional_notes
)
VALUES (
  'brand_axiom_01',
  'BrandGuard AI',
  'Autonomous enterprise brand governance and pre-publication compliance platform.',
  'Enterprise Software & Brand Governance',
  'Global marketing directors, legal teams, and brand leads',
  'Professional',
  'English (US)',
  'Requires verified third-party citations for all superlative and performance claims.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO brand_rules (
  id, brand_id, title, category, severity, description, example, example_violation, remedy_recommendation, source_description, source_url, enabled
)
VALUES (
  'rule-unsupported-claims',
  'brand_axiom_01',
  'Unsupported Marketing Claims',
  'Claims & Restrictions',
  'Critical',
  'Absolute claims and unsubstantiated superlatives (e.g. "most trusted", "fastest", "first in market", "100% immunity", "outperforming all") must not be made without citing registered third-party audit benchmarks.',
  '"BrandGuard AI is the most trusted and fastest brand platform, guaranteeing 100% immunity."',
  '"guarantees 100% immunity from PR disasters"',
  'Replace with specific, verifiable performance metrics and cite audited third-party benchmarks.',
  'Marketing Governance & Claim Substantiation Policy §4.2',
  'https://brandguard.internal/policies/claim-substantiation',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO brand_reviews (
  id, brand_id, title, author, channel, status, updated_at_label, word_count, issues_count,
  confidence_score, summary, original_draft, current_draft, rules_checked_count,
  first_pass_issues_count, first_pass_score, first_pass_findings, findings, decision_history, revisions
)
VALUES (
  'rev_spring_announcement_01',
  'brand_axiom_01',
  'Spring Campaign Announcement Draft',
  'Workspace Reviewer',
  'Press Release',
  'Needs review',
  '12 minutes ago',
  42,
  1,
  80,
  'Flagged 1 unsupported marketing claim ("most trusted and fastest brand platform").',
  'BrandGuard AI is the most trusted and fastest brand platform, guaranteeing 100% immunity. Our enterprise suite provides complete oversight across channels.',
  'BrandGuard AI is the most trusted and fastest brand platform, guaranteeing 100% immunity. Our enterprise suite provides complete oversight across channels.',
  1,
  1,
  80,
  '[{"id":"finding_rule-unsupported-claims_21","ruleId":"rule-unsupported-claims","ruleTitle":"Unsupported Marketing Claims","ruleCategory":"Claims & Restrictions","severity":"Critical","matchedText":"most trusted","location":{"startIndex":21,"endIndex":33,"line":1},"explanation":"Unsupported marketing claim or superlative detected: \"most trusted\". Rule \"Unsupported Marketing Claims\" requires verifiable benchmark citations.","suggestedCorrection":"Replace with specific, verifiable performance metrics and cite audited third-party benchmarks.","sourceDescription":"Marketing Governance & Claim Substantiation Policy §4.2","sourceUrl":"https://brandguard.internal/policies/claim-substantiation"}]'::jsonb,
  '[{"id":"finding_rule-unsupported-claims_21","ruleId":"rule-unsupported-claims","ruleTitle":"Unsupported Marketing Claims","ruleCategory":"Claims & Restrictions","severity":"Critical","matchedText":"most trusted","location":{"startIndex":21,"endIndex":33,"line":1},"explanation":"Unsupported marketing claim or superlative detected: \"most trusted\". Rule \"Unsupported Marketing Claims\" requires verifiable benchmark citations.","suggestedCorrection":"Replace with specific, verifiable performance metrics and cite audited third-party benchmarks.","sourceDescription":"Marketing Governance & Claim Substantiation Policy §4.2","sourceUrl":"https://brandguard.internal/policies/claim-substantiation"}]'::jsonb,
  '[{"id":"dec_init_01","action":"Save Draft","reviewerName":"Workspace Reviewer","reviewerComment":"Initial submission pending editorial review.","timestamp":"2026-10-23T06:00:00.000Z","previousStatus":"Draft","newStatus":"Needs review"}]'::jsonb,
  '[]'::jsonb
),
(
  'rev_enterprise_overview_02',
  'brand_axiom_01',
  'Enterprise Brand Governance Overview',
  'Workspace Reviewer',
  'Product Overview',
  'In review',
  '1 hour ago',
  48,
  0,
  100,
  '0 rule violations detected across active brand guidelines.',
  'BrandGuard™ helps cross-functional marketing and legal teams review public-facing copy prior to release. By auditing draft statements against verified policies, reviewers maintain complete editorial authority with full audit traceability.',
  'BrandGuard™ helps cross-functional marketing and legal teams review public-facing copy prior to release. By auditing draft statements against verified policies, reviewers maintain complete editorial authority with full audit traceability.',
  1,
  0,
  100,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"id":"dec_init_02","action":"Save Draft","reviewerName":"Workspace Reviewer","reviewerComment":"Draft submitted with clean rule compliance. Awaiting human reviewer sign-off.","timestamp":"2026-10-23T05:15:00.000Z","previousStatus":"Draft","newStatus":"In review"}]'::jsonb,
  '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;
