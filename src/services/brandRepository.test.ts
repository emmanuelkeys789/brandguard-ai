import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  rowToProfile,
  profileToRow,
  rowToRule,
  ruleToRow,
  rowToReview,
  reviewToRow,
  brandRepository
} from './brandRepository.ts';
import {
  brandStorage,
  DEFAULT_INITIAL_PROFILE,
  DEFAULT_UNSUPPORTED_CLAIMS_RULE
} from './brandStorage.ts';
import type { BrandProfile, BrandRule, ReviewItem } from '../types/index.ts';

// In-memory localStorage mock for node environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] !== undefined ? store[key] : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
})();

// Attach mock to globalThis
Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true
});

describe('Database Repository & Data Mappers Tests', () => {
  beforeEach(() => {
    storageMock.clear();
    brandRepository.setClientForTesting(null);
  });

  afterEach(() => {
    brandRepository.setClientForTesting(null);
  });

  describe('PostgreSQL Row Mappers', () => {
    test('1. Profile row mapper handles camelCase <-> snake_case roundtrip', () => {
      const sampleProfile: BrandProfile = {
        id: 'prof_test_101',
        name: 'Axiom Health Systems',
        description: 'Next-generation clinical intelligence',
        industry: 'Healthcare & Life Sciences',
        targetAudience: 'Chief Medical Officers and Hospital Executives',
        communicationTone: 'Professional',
        toneCustomDetails: 'Authoritative yet empathetic clinical tone',
        preferredLanguage: 'English (US)',
        additionalNotes: 'Requires FDA disclaimer on all public claims',
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-01T12:00:00.000Z'
      };

      const row = profileToRow(sampleProfile);
      assert.equal(row.id, sampleProfile.id);
      assert.equal(row.name, sampleProfile.name);
      assert.equal(row.target_audience, sampleProfile.targetAudience);
      assert.equal(row.communication_tone, sampleProfile.communicationTone);
      assert.equal(row.tone_custom_details, sampleProfile.toneCustomDetails);
      assert.equal(row.preferred_language, sampleProfile.preferredLanguage);
      assert.equal(row.additional_notes, sampleProfile.additionalNotes);

      const reconstructed = rowToProfile(row);
      assert.deepEqual(reconstructed, sampleProfile);
    });

    test('2. Rule row mapper maps all metadata and constraint fields', () => {
      const sampleRule: BrandRule = {
        id: 'rule_test_202',
        brandId: 'brand_axiom_01',
        title: 'Mandatory Clinical Disclaimers',
        category: 'Claims & Restrictions',
        severity: 'Critical',
        description: 'All therapeutic outcomes must be accompanied by trial citations.',
        example: 'Our platform accelerates diagnosis across all patients.',
        exampleViolation: '100% cure rate guarantee',
        remedyRecommendation: 'Cite peer-reviewed study and include standard investigative disclaimer.',
        sourceDescription: 'FDA Section 502 Guidelines',
        sourceUrl: 'https://fda.gov/guidelines/502',
        enabled: true,
        code: 'CLINICAL_DISCLAIMER_01',
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-01T12:00:00.000Z'
      };

      const row = ruleToRow(sampleRule);
      assert.equal(row.id, sampleRule.id);
      assert.equal(row.brand_id, sampleRule.brandId);
      assert.equal(row.title, sampleRule.title);
      assert.equal(row.example_violation, sampleRule.exampleViolation);
      assert.equal(row.remedy_recommendation, sampleRule.remedyRecommendation);
      assert.equal(row.source_description, sampleRule.sourceDescription);
      assert.equal(row.source_url, sampleRule.sourceUrl);
      assert.equal(row.enabled, true);

      const reconstructed = rowToRule(row);
      assert.deepEqual(reconstructed, sampleRule);
    });

    test('3. Review row mapper preserves immutable first-pass metrics and JSONB history', () => {
      const sampleReview: ReviewItem = {
        id: 'rev_test_303',
        title: 'Q1 Product Launch Announcement',
        author: 'Sarah Chen (Lead Strategist)',
        channel: 'LinkedIn',
        status: 'Needs review',
        updatedAt: '10m ago',
        wordCount: 145,
        issuesCount: 2,
        confidenceScore: 78,
        summary: '2 brand compliance issues flagged in first pass.',
        originalDraft: 'BrandGuard AI is the most trusted and fastest platform, guaranteeing 100% immunity.',
        currentDraft: 'BrandGuard AI is an industry-tested platform with audited safeguards.',
        rulesCheckedCount: 8,
        firstPassIssuesCount: 2,
        firstPassScore: 78,
        firstPassFindings: [
          {
            id: 'find-1',
            ruleId: 'rule-claims-01',
            title: 'Unsupported Marketing Claims',
            category: 'Claims & Restrictions',
            severity: 'Critical',
            snippet: 'most trusted and fastest',
            startIndex: 18,
            endIndex: 42,
            suggestion: 'Specify verifiable metrics.'
          }
        ],
        findings: [],
        decisionHistory: [
          {
            id: 'dec-1',
            action: 'Requested Changes',
            timestamp: '2026-03-01T11:00:00.000Z',
            reviewer: 'Alex Compliance Officer',
            comment: 'Please remove superlatives before publishing.'
          }
        ],
        revisions: [
          {
            revisionNumber: 1,
            timestamp: '2026-03-01T11:15:00.000Z',
            revisedBy: 'Sarah Chen',
            draftContent: 'BrandGuard AI is an industry-tested platform with audited safeguards.',
            previousDraftContent: 'BrandGuard AI is the most trusted and fastest platform, guaranteeing 100% immunity.',
            findingsCount: 0,
            score: 100
          }
        ],
        reviewerComment: 'Awaiting secondary executive signoff',
        decisionAt: '2026-03-01T11:00:00.000Z',
        reviewedBy: 'Alex Compliance Officer'
      };

      const row = reviewToRow(sampleReview);
      assert.equal(row.id, sampleReview.id);
      assert.equal(row.first_pass_issues_count, 2);
      assert.equal(row.first_pass_score, 78);
      assert.equal(row.first_pass_findings.length, 1);
      assert.equal(row.decision_history.length, 1);
      assert.equal(row.revisions.length, 1);
      assert.equal(row.original_draft, sampleReview.originalDraft);
      assert.equal(row.current_draft, sampleReview.currentDraft);

      const reconstructed = rowToReview(row);
      assert.equal(reconstructed.id, sampleReview.id);
      assert.equal(reconstructed.firstPassIssuesCount, 2);
      assert.equal(reconstructed.firstPassScore, 78);
      assert.equal(reconstructed.firstPassFindings.length, 1);
      assert.equal(reconstructed.findings.length, 0);
      assert.equal(reconstructed.decisionHistory.length, 1);
      assert.equal(reconstructed.revisions.length, 1);
      assert.equal(reconstructed.reviewerComment, 'Awaiting secondary executive signoff');
    });
  });

  describe('Offline & Unconfigured Environment Handling', () => {
    test('4. Connection state reports unconfigured when Supabase env vars are absent', async () => {
      const state = await brandRepository.getConnectionState();
      assert.equal(state.status, 'unconfigured');
      assert.equal(state.provider, 'local');
      assert.ok(state.errorMessage?.includes('LocalStorage mode'));
      assert.equal(brandRepository.isCloudConfigured(), false);
    });

    test('5. getProfile returns default profile when storage is clean', async () => {
      const profile = await brandRepository.getProfile();
      assert.ok(profile);
      assert.equal(profile.name, DEFAULT_INITIAL_PROFILE.name);
      assert.equal(profile.industry, DEFAULT_INITIAL_PROFILE.industry);
    });

    test('6. saveProfile persists locally and returns data safely', async () => {
      const result = await brandRepository.saveProfile({
        name: 'Nexus Security Systems',
        description: 'Zero-trust enterprise identity',
        industry: 'Cybersecurity',
        targetAudience: 'CISOs and IT Directors',
        communicationTone: 'Direct & Concise',
        preferredLanguage: 'English (US)'
      });

      assert.equal(result.success, true);
      assert.ok(result.data?.id);
      assert.equal(result.data?.name, 'Nexus Security Systems');

      const retrieved = await brandRepository.getProfile();
      assert.equal(retrieved?.name, 'Nexus Security Systems');
    });

    test('7. deleteProfile removes profile from storage', async () => {
      await brandRepository.saveProfile({
        name: 'Temporary Brand',
        description: 'To be deleted',
        industry: 'Test',
        targetAudience: 'Anyone',
        communicationTone: 'Casual',
        preferredLanguage: 'English (US)'
      });

      const delResult = await brandRepository.deleteProfile();
      assert.equal(delResult.success, true);

      const retrieved = await brandRepository.getProfile();
      assert.equal(retrieved, null);
    });

    test('8. Rule repository supports fetch, save, toggle, and delete', async () => {
      const rules = await brandRepository.getRules();
      assert.ok(rules.length >= 1, 'Should initialize with default rules');

      const newRuleResult = await brandRepository.saveRule({
        title: 'Custom Competitor Rule',
        category: 'Competitor Mentions',
        severity: 'High',
        description: 'Never disparage competitors directly.',
        enabled: true
      });

      assert.equal(newRuleResult.success, true);
      const ruleId = newRuleResult.data!.id;

      // Toggle enabled
      const toggleResult = await brandRepository.toggleRuleEnabled(ruleId);
      assert.equal(toggleResult.success, true);
      assert.equal(toggleResult.data?.enabled, false);

      // Delete rule
      const deleteResult = await brandRepository.deleteRule(ruleId);
      assert.equal(deleteResult.success, true);

      const remainingRules = await brandRepository.getRules();
      assert.equal(remainingRules.some((r) => r.id === ruleId), false);
    });

    test('9. Review repository supports full audit and immutable fields storage', async () => {
      const saveResult = await brandRepository.saveReview({
        title: 'Press Release v1',
        author: 'Jordan Miller',
        channel: 'Website',
        status: 'Needs review',
        wordCount: 88,
        issuesCount: 1,
        confidenceScore: 85,
        summary: 'One issue found.',
        originalDraft: 'We are the fastest tool on the market.',
        currentDraft: 'We are an efficient tool.',
        rulesCheckedCount: 5,
        firstPassIssuesCount: 1,
        firstPassScore: 85,
        firstPassFindings: [
          {
            id: 'find-pr-1',
            ruleId: DEFAULT_UNSUPPORTED_CLAIMS_RULE.id,
            title: DEFAULT_UNSUPPORTED_CLAIMS_RULE.title,
            category: DEFAULT_UNSUPPORTED_CLAIMS_RULE.category,
            severity: DEFAULT_UNSUPPORTED_CLAIMS_RULE.severity,
            snippet: 'fastest tool',
            startIndex: 11,
            endIndex: 23,
            suggestion: 'Use measurable speed metrics'
          }
        ],
        findings: [],
        decisionHistory: [],
        revisions: []
      });

      assert.equal(saveResult.success, true);
      assert.ok(saveResult.data?.id);

      const retrievedReviews = await brandRepository.getReviews();
      const saved = retrievedReviews.find((r) => r.id === saveResult.data!.id);
      assert.ok(saved);
      assert.equal(saved.firstPassIssuesCount, 1);
      assert.equal(saved.firstPassScore, 85);
      assert.equal(saved.firstPassFindings.length, 1);

      // Delete
      const delResult = await brandRepository.deleteReview(saved.id);
      assert.equal(delResult.success, true);
    });

    test('10. syncLocalDataToDatabase reports clean error when unconfigured without mutating data', async () => {
      // Seed a profile and rule in local storage
      brandStorage.saveProfile({
        name: 'Sync Brand Test',
        description: 'Testing sync',
        industry: 'FinTech',
        targetAudience: 'Traders',
        communicationTone: 'Professional',
        preferredLanguage: 'English (US)'
      });

      const syncResult = await brandRepository.syncLocalDataToDatabase();
      assert.equal(syncResult.success, false);
      assert.ok(syncResult.errors.length > 0);
      assert.ok(syncResult.errors[0].includes('Supabase credentials are not configured'));

      // Ensure local data remains intact
      const localProfile = brandStorage.getStoredProfile();
      assert.equal(localProfile?.name, 'Sync Brand Test');
    });
  });

  describe('Mocked Supabase Operations & Remote Error Surfacing', () => {
    test('11. Connection state reports connected when mock Supabase client ping succeeds', async () => {
      const mockClient = {
        from: (_table: string) => ({
          select: () => ({
            limit: () => Promise.resolve({ data: [{ id: 'test' }], error: null })
          })
        })
      };

      brandRepository.setClientForTesting(mockClient);
      assert.equal(brandRepository.isCloudConfigured(), true);

      const state = await brandRepository.getConnectionState();
      assert.equal(state.status, 'connected');
      assert.equal(state.provider, 'supabase');
    });

    test('12. Connection state reports error and surfaces message when mock query fails', async () => {
      const mockClient = {
        from: (_table: string) => ({
          select: () => ({
            limit: () => Promise.resolve({ data: null, error: { message: 'Database connection refused' } })
          })
        })
      };

      brandRepository.setClientForTesting(mockClient);
      const state = await brandRepository.getConnectionState();
      assert.equal(state.status, 'error');
      assert.equal(state.provider, 'supabase');
      assert.equal(state.errorMessage, 'Database connection refused');
    });

    test('13. getProfile maps cloud PostgreSQL row and refreshes local mirror', async () => {
      const mockProfileRow = {
        id: 'prof_cloud_1',
        name: 'Cloud Health Systems',
        description: 'Enterprise healthcare',
        industry: 'Healthcare',
        target_audience: 'Doctors',
        communication_tone: 'Professional',
        tone_custom_details: null,
        preferred_language: 'English (US)',
        additional_notes: 'HIPAA compliant',
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z'
      };

      const mockClient = {
        from: (_table: string) => ({
          select: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [mockProfileRow], error: null })
            })
          })
        })
      };

      brandRepository.setClientForTesting(mockClient);
      const profile = await brandRepository.getProfile();

      assert.ok(profile);
      assert.equal(profile.name, 'Cloud Health Systems');
      assert.equal(profile.targetAudience, 'Doctors');

      // Verify local storage mirror was refreshed
      const local = brandStorage.getStoredProfile();
      assert.equal(local?.name, 'Cloud Health Systems');
    });

    test('14. saveReview surfaces explicit error without pretending success when cloud upsert fails', async () => {
      const mockClient = {
        from: (_table: string) => ({
          upsert: () => Promise.resolve({ data: null, error: { message: 'permission denied for table brand_reviews (RLS)' } })
        })
      };

      brandRepository.setClientForTesting(mockClient);

      const result = await brandRepository.saveReview({
        title: 'Review with DB failure',
        author: 'Tester',
        channel: 'LinkedIn',
        status: 'Needs review',
        wordCount: 10,
        issuesCount: 0,
        confidenceScore: 100,
        summary: 'Test',
        originalDraft: 'Clean copy',
        currentDraft: 'Clean copy',
        rulesCheckedCount: 1,
        firstPassIssuesCount: 0,
        firstPassScore: 100,
        firstPassFindings: [],
        findings: [],
        decisionHistory: [],
        revisions: []
      });

      // Crucial: Must NOT report success: true when cloud save failed
      assert.equal(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Cloud Database write failed'));
      assert.ok(result.error.includes('permission denied for table brand_reviews'));
    });

    test('15. saveRule surfaces error when cloud update fails', async () => {
      const mockClient = {
        from: (_table: string) => ({
          upsert: () => Promise.resolve({ data: null, error: { message: 'foreign key constraint violation' } })
        })
      };

      brandRepository.setClientForTesting(mockClient);

      const result = await brandRepository.saveRule({
        title: 'Failing Rule',
        category: 'Claims & Restrictions',
        severity: 'Critical',
        description: 'Test rule'
      });

      assert.equal(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Cloud Database write failed'));
      assert.ok(result.error.includes('foreign key constraint violation'));
    });

    test('16. syncLocalDataToDatabase succeeds across all tables when cloud accepts upserts', async () => {
      // Seed local storage with profile, rule, and review
      brandStorage.saveProfile({
        name: 'Sync Success Brand',
        description: 'Test',
        industry: 'FinTech',
        targetAudience: 'Everyone',
        communicationTone: 'Professional',
        preferredLanguage: 'English (US)'
      });

      const upsertedTables: string[] = [];
      const mockClient = {
        from: (table: string) => ({
          upsert: (_row: any, _opts: any) => {
            upsertedTables.push(table);
            return Promise.resolve({ data: null, error: null });
          }
        })
      };

      brandRepository.setClientForTesting(mockClient);
      const syncResult = await brandRepository.syncLocalDataToDatabase();

      assert.equal(syncResult.success, true);
      assert.equal(syncResult.errors.length, 0);
      assert.ok(syncResult.profilesCount >= 1);
      assert.ok(syncResult.rulesCount >= 1);
      assert.ok(syncResult.reviewsCount >= 1);
      assert.ok(upsertedTables.includes('brand_profiles'));
      assert.ok(upsertedTables.includes('brand_rules'));
      assert.ok(upsertedTables.includes('brand_reviews'));
    });

    test('17. syncLocalDataToDatabase aggregates errors if a table fails without losing other syncs', async () => {
      brandStorage.saveProfile({
        name: 'Sync Partial Brand',
        description: 'Test',
        industry: 'FinTech',
        targetAudience: 'Everyone',
        communicationTone: 'Professional',
        preferredLanguage: 'English (US)'
      });

      const mockClient = {
        from: (table: string) => ({
          upsert: () => {
            if (table === 'brand_reviews') {
              return Promise.resolve({ data: null, error: { message: 'Review table lock timeout' } });
            }
            return Promise.resolve({ data: null, error: null });
          }
        })
      };

      brandRepository.setClientForTesting(mockClient);
      const syncResult = await brandRepository.syncLocalDataToDatabase();

      assert.equal(syncResult.success, false);
      assert.ok(syncResult.profilesCount >= 1, 'Profile succeeded');
      assert.ok(syncResult.rulesCount >= 1, 'Rules succeeded');
      assert.ok(syncResult.errors.length > 0, 'Captured review failure');
      assert.ok(syncResult.errors.some((e) => e.includes('Review table lock timeout')));
    });
  });
});
