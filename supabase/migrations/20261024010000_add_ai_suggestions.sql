-- ========================================================================
-- Migration: 20261024010000_add_ai_suggestions.sql
-- Description: Add ai_suggestions, ai_analysis_status, and ai_analysis_error to brand_reviews
-- ========================================================================

ALTER TABLE brand_reviews
  ADD COLUMN IF NOT EXISTS ai_suggestions JSONB DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS ai_analysis_status TEXT,
  ADD COLUMN IF NOT EXISTS ai_analysis_error TEXT;
