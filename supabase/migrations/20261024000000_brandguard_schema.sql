-- ========================================================================
-- Migration: 20261024000000_brandguard_schema.sql
-- Description: Core tables, foreign keys, indexes, and RLS policies for BrandGuard AI
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: brand_profiles
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

-- 2. Table: brand_rules
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

-- 3. Table: brand_reviews
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_rules_brand_id ON brand_rules(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_rules_category ON brand_rules(category);
CREATE INDEX IF NOT EXISTS idx_brand_rules_enabled ON brand_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_brand_id ON brand_reviews(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_status ON brand_reviews(status);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_channel ON brand_reviews(channel);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_created_at ON brand_reviews(created_at DESC);

-- Row Level Security
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reviews ENABLE ROW LEVEL SECURITY;

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
