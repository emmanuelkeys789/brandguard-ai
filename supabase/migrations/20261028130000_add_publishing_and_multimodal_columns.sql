-- ========================================================================
-- Migration: 20261028130000_add_publishing_and_multimodal_columns.sql
-- Description: Add publishing and multimodal creative compliance columns to brand_reviews
-- ========================================================================

ALTER TABLE brand_reviews
  ADD COLUMN IF NOT EXISTS publishing_status TEXT,
  ADD COLUMN IF NOT EXISTS publishing_record JSONB,
  ADD COLUMN IF NOT EXISTS image_asset JSONB,
  ADD COLUMN IF NOT EXISTS visual_findings JSONB DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS visual_analysis_status TEXT,
  ADD COLUMN IF NOT EXISTS visual_analysis_error TEXT,
  ADD COLUMN IF NOT EXISTS visual_provider TEXT,
  ADD COLUMN IF NOT EXISTS visual_model TEXT;

-- Index for efficient querying by publishing status
CREATE INDEX IF NOT EXISTS idx_brand_reviews_publishing_status ON brand_reviews(publishing_status);
