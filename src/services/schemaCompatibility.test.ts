import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { rowToReview, reviewToRow } from './brandRepository.ts';
import type { ReviewItem, ImageAsset, PublishingRecord, VisualAnalysisFinding } from '../types/index.ts';

describe('Schema Compatibility and Deployment Safety Tests', () => {
  const workspaceRoot = process.cwd();
  const migrationPath = path.join(
    workspaceRoot,
    'supabase/migrations/20261028130000_add_publishing_and_multimodal_columns.sql'
  );
  const schemaPath = path.join(workspaceRoot, 'supabase/schema.sql');
  const netlifyTomlPath = path.join(workspaceRoot, 'netlify.toml');
  const redirectsPath = path.join(workspaceRoot, 'public/_redirects');

  describe('1. Versioned Migration File Integrity', () => {
    test('migration file exists and follows naming convention', () => {
      assert.ok(fs.existsSync(migrationPath), `Migration file not found at ${migrationPath}`);
      const filename = path.basename(migrationPath);
      assert.match(filename, /^\d{14}_[a-z0-9_]+\.sql$/);
    });

    test('migration is safe, additive, and uses ADD COLUMN IF NOT EXISTS', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Disallow destructive statements
      assert.doesNotMatch(sql, /\bDROP\b/i, 'Migration must never contain DROP statements');
      assert.doesNotMatch(sql, /\bRENAME\b/i, 'Migration must never contain RENAME statements');
      assert.doesNotMatch(sql, /\bTRUNCATE\b/i, 'Migration must never contain TRUNCATE statements');

      // Check all 8 required columns
      const requiredColumns = [
        'publishing_status',
        'publishing_record',
        'image_asset',
        'visual_findings',
        'visual_analysis_status',
        'visual_analysis_error',
        'visual_provider',
        'visual_model'
      ];

      for (const col of requiredColumns) {
        assert.ok(
          sql.includes(`ADD COLUMN IF NOT EXISTS ${col}`),
          `Migration must safely add column ${col} with ADD COLUMN IF NOT EXISTS`
        );
      }

      // Check exact types and constraints
      assert.match(sql, /publishing_status\s+TEXT/i);
      assert.match(sql, /publishing_record\s+JSONB/i);
      assert.match(sql, /image_asset\s+JSONB/i);
      assert.match(sql, /visual_findings\s+JSONB\s+DEFAULT\s+'\[\]'::jsonb\s+NOT\s+NULL/i);
      assert.match(sql, /visual_analysis_status\s+TEXT/i);
      assert.match(sql, /visual_analysis_error\s+TEXT/i);
      assert.match(sql, /visual_provider\s+TEXT/i);
      assert.match(sql, /visual_model\s+TEXT/i);

      // Check publishing_status index
      assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_brand_reviews_publishing_status ON brand_reviews\(publishing_status\)/i);
    });
  });

  describe('2. Master Schema Parity (supabase/schema.sql)', () => {
    test('schema.sql includes all publishing and multimodal columns in brand_reviews', () => {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');

      const expectedDefinitions = [
        'publishing_status TEXT',
        'publishing_record JSONB',
        'image_asset JSONB',
        "visual_findings JSONB DEFAULT '[]'::jsonb NOT NULL",
        'visual_analysis_status TEXT',
        'visual_analysis_error TEXT',
        'visual_provider TEXT',
        'visual_model TEXT'
      ];

      for (const def of expectedDefinitions) {
        assert.ok(
          schemaSql.includes(def),
          `supabase/schema.sql missing definition: "${def}"`
        );
      }

      assert.ok(
        schemaSql.includes('CREATE INDEX IF NOT EXISTS idx_brand_reviews_publishing_status ON brand_reviews(publishing_status);'),
        'supabase/schema.sql missing idx_brand_reviews_publishing_status'
      );
    });
  });

  describe('3. Application Data Mapper Serialization & Nullability', () => {
    test('roundtrips all 8 publishing and multimodal fields accurately', () => {
      const sampleImageAsset: ImageAsset = {
        id: 'img_test_01',
        fileName: 'brand_banner.png',
        fileType: 'image/png',
        fileSize: 1048576,
        altText: 'Hero banner featuring modern brand palette',
        thumbnailDataUrl: 'data:image/png;base64,iVBORw0KGgo...',
        width: 1200,
        height: 630
      };

      const sampleVisualFinding: VisualAnalysisFinding = {
        id: 'vis_find_01',
        category: 'Logo & Visual Identity',
        severity: 'Critical',
        title: 'Logo Aspect Ratio Distortion',
        description: 'Brand logo is stretched horizontally by 18%.',
        observableEvidence: 'The emblem proportions deviate from the 1:1 guideline ratio.',
        isUncertain: false,
        confidence: 'High',
        suggestedRemedy: 'Lock aspect ratio to 1:1 when scaling.',
        relatedRuleId: 'rule_logo_01',
        relatedRuleTitle: 'Logo Integrity Guidelines',
        hasVerifiedPolicyEvidence: true,
        citationLabel: 'Brand Identity Standards §2.1'
      };

      const samplePublishingRecord: PublishingRecord = {
        idempotencyKey: 'idem_test_abc123',
        destinationUrl: 'https://api.cms.internal/v1/publish',
        destinationName: 'Corporate CMS',
        status: 'published',
        publishedAt: '2026-10-28T14:00:00.000Z',
        lastAttemptAt: '2026-10-28T14:00:00.000Z',
        attemptCount: 1,
        externalReference: 'cms_doc_9988'
      };

      const review: ReviewItem = {
        id: 'rev_schema_test_01',
        title: 'Q4 Product Launch Press Release',
        author: 'Lead Compliance Reviewer',
        channel: 'Press Release',
        status: 'Approved',
        updatedAt: 'Just now',
        wordCount: 120,
        issuesCount: 1,
        confidenceScore: 92,
        summary: 'Multimodal and publishing ready draft.',
        originalDraft: 'Original press release draft content.',
        currentDraft: 'Refined press release draft content.',
        imageAsset: sampleImageAsset,
        visualFindings: [sampleVisualFinding],
        visualAnalysisStatus: 'completed',
        visualAnalysisError: undefined,
        visualProvider: 'gemini',
        visualModel: 'gemini-1.5-flash',
        publishingStatus: 'published',
        publishingRecord: samplePublishingRecord
      };

      // Serialize to DB row
      const row = reviewToRow(review);

      assert.equal(row.publishing_status, 'published');
      assert.deepEqual(row.publishing_record, samplePublishingRecord);
      assert.deepEqual(row.image_asset, sampleImageAsset);
      assert.deepEqual(row.visual_findings, [sampleVisualFinding]);
      assert.equal(row.visual_analysis_status, 'completed');
      assert.equal(row.visual_analysis_error, null);
      assert.equal(row.visual_provider, 'gemini');
      assert.equal(row.visual_model, 'gemini-1.5-flash');

      // Deserialize back from DB row
      const restored = rowToReview(row);

      assert.equal(restored.publishingStatus, 'published');
      assert.deepEqual(restored.publishingRecord, samplePublishingRecord);
      assert.deepEqual(restored.imageAsset, sampleImageAsset);
      assert.deepEqual(restored.visualFindings, [sampleVisualFinding]);
      assert.equal(restored.visualAnalysisStatus, 'completed');
      assert.equal(restored.visualAnalysisError, undefined);
      assert.equal(restored.visualProvider, 'gemini');
      assert.equal(restored.visualModel, 'gemini-1.5-flash');
    });

    test('preserves clean nulls/defaults when fields are unset', () => {
      const minimalReview: ReviewItem = {
        id: 'rev_minimal_01',
        title: 'Simple Text Review',
        author: 'Workspace Reviewer',
        channel: 'Blog Post',
        status: 'Needs review',
        updatedAt: 'Just now',
        wordCount: 50,
        issuesCount: 0,
        confidenceScore: 100,
        summary: 'No issues.'
      };

      const row = reviewToRow(minimalReview);

      assert.equal(row.publishing_status, null);
      assert.equal(row.publishing_record, null);
      assert.equal(row.image_asset, null);
      // visual_findings defaults to empty array [] in DB row to satisfy NOT NULL constraint
      assert.deepEqual(row.visual_findings, []);
      assert.equal(row.visual_analysis_status, null);
      assert.equal(row.visual_analysis_error, null);
      assert.equal(row.visual_provider, null);
      assert.equal(row.visual_model, null);

      const restored = rowToReview(row);

      assert.equal(restored.publishingStatus, undefined);
      assert.equal(restored.publishingRecord, undefined);
      assert.equal(restored.imageAsset, undefined);
      assert.equal(restored.visualAnalysisStatus, undefined);
      assert.equal(restored.visualAnalysisError, undefined);
      assert.equal(restored.visualProvider, undefined);
      assert.equal(restored.visualModel, undefined);
    });
  });

  describe('4. Netlify Deployment Routing Safety', () => {
    test('Netlify Functions v2 define exact in-source routes for all API endpoints', async () => {
      const publishFunc = await import('../../netlify/functions/publish.ts');
      const aiToneFunc = await import('../../netlify/functions/ai-tone-review.ts');
      const multimodalFunc = await import('../../netlify/functions/multimodal-review.ts');

      assert.equal(publishFunc.config?.path, '/api/publish');
      assert.equal(aiToneFunc.config?.path, '/api/ai-tone-review');
      assert.equal(multimodalFunc.config?.path, '/api/multimodal-review');
    });

    test('netlify.toml and public/_redirects preserve SPA routing without forced rewrites', () => {
      const tomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
      const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');

      // Check SPA redirect exists
      assert.ok(tomlContent.includes('from = "/*"'));
      assert.ok(tomlContent.includes('to = "/index.html"'));
      assert.ok(redirectsContent.includes('/*  /index.html  200'));

      // Ensure no forced rewrite flag (!) that would shadow Netlify Functions v2 routes
      assert.doesNotMatch(redirectsContent, /\/\*\s+\/index\.html\s+200!/);
      assert.doesNotMatch(tomlContent, /force\s*=\s*true/i);
    });
  });
});
