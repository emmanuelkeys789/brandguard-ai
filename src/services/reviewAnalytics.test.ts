import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReviewAnalytics,
  getFirstPassIssuesCount,
  isReviewCheckRequired
} from './reviewAnalytics.ts';
import {
  brandStorage,
  DEFAULT_UNSUPPORTED_CLAIMS_RULE
} from './brandStorage.ts';
import { evaluateDraft } from './ruleEngine.ts';
import type { ReviewItem, ReviewDecisionRecord } from '../types/index.ts';

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

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true
});

describe('Trends & Insights Analytics Tests', () => {
  beforeEach(() => {
    storageMock.clear();
  });

  test('1. Zero reviews handles empty data without division-by-zero errors', () => {
    const emptyAnalytics = calculateReviewAnalytics([], [DEFAULT_UNSUPPORTED_CLAIMS_RULE]);

    assert.equal(emptyAnalytics.totalReviews, 0);
    assert.equal(emptyAnalytics.totalAuditedReviews, 0);
    assert.equal(emptyAnalytics.cleanFirstPassCount, 0);
    assert.equal(emptyAnalytics.cleanFirstPassRate, 0);
    assert.equal(emptyAnalytics.totalCurrentIssues, 0);
    assert.equal(emptyAnalytics.avgIssuesPerReview, '0.0');
    assert.deepEqual(emptyAnalytics.channelBreakdown, []);
    assert.deepEqual(emptyAnalytics.statusDistribution, []);
    assert.deepEqual(emptyAnalytics.topViolations, []);
    assert.equal(emptyAnalytics.hasAuditedData, false);
    assert.equal(emptyAnalytics.checkRequiredCount, 0);
  });

  test('2. Missing or unverified check results honestly flagged as "Check required"', () => {
    const checkRequiredReview: ReviewItem = {
      id: 'rev_missing_draft',
      title: 'Missing Content Review',
      author: 'Workspace Reviewer',
      channel: 'Blog',
      status: 'Needs review',
      updatedAt: 'Just now',
      wordCount: 0,
      issuesCount: 0,
      confidenceScore: 100,
      summary: 'No checks executed',
      findings: []
    };

    assert.equal(isReviewCheckRequired(checkRequiredReview), true);

    const analytics = calculateReviewAnalytics([checkRequiredReview], [DEFAULT_UNSUPPORTED_CLAIMS_RULE]);
    assert.equal(analytics.totalReviews, 1);
    assert.equal(analytics.totalAuditedReviews, 0);
    assert.equal(analytics.checkRequiredCount, 1);
    // Un-audited review must NOT count as clean and has no verifiable first-pass data
    assert.equal(analytics.cleanFirstPassCount, 0);
    assert.equal(analytics.cleanFirstPassRate, null, 'Rate should be null indicating data unavailable');
    assert.equal(analytics.hasVerifiableFirstPassData, false);
    assert.equal(analytics.firstPassUnavailableCount, 1);
    assert.equal(analytics.hasAuditedData, false);
  });

  test('3. Distinguish original first-pass findings from findings after revisions', () => {
    const rules = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];

    // Draft with an initial violation: "most trusted"
    const originalWithFinding = 'BrandGuard AI is the most trusted enterprise brand platform in the world.';
    const correctedDraft = 'BrandGuard AI provides verifiable benchmark verification for enterprise brand teams.';

    // Review that started with 1 violation, but was edited and reran to 0 violations
    const revisedReview: ReviewItem = {
      id: 'rev_corrected_01',
      title: 'Revised Product Announcement',
      author: 'Workspace Reviewer',
      channel: 'Press Release',
      status: 'Changes Requested',
      updatedAt: 'Just now',
      wordCount: 10,
      issuesCount: 0, // Current active issues are 0 after revision!
      confidenceScore: 100,
      summary: '0 rule violations detected.',
      originalDraft: originalWithFinding,
      currentDraft: correctedDraft,
      firstPassIssuesCount: 1, // Stored first pass had 1 issue
      firstPassScore: 80,
      findings: [],
      revisions: [
        {
          id: 'rev_rec_1',
          revisionNumber: 1,
          text: correctedDraft,
          editedAt: new Date().toISOString(),
          findingsCount: 0,
          score: 100
        }
      ]
    };

    // A genuinely clean review that passed on its first pass
    const genuinelyCleanReview: ReviewItem = {
      id: 'rev_clean_02',
      title: 'Compliant Policy Overview',
      author: 'Workspace Reviewer',
      channel: 'Social Media',
      status: 'Approved',
      updatedAt: '1 hour ago',
      wordCount: 12,
      issuesCount: 0,
      confidenceScore: 100,
      summary: '0 rule violations detected.',
      originalDraft: 'BrandGuard provides structured editorial guidance according to verified documentation.',
      currentDraft: 'BrandGuard provides structured editorial guidance according to verified documentation.',
      firstPassIssuesCount: 0,
      firstPassScore: 100,
      findings: []
    };

    // First-pass derivation check
    assert.equal(getFirstPassIssuesCount(revisedReview, rules), 1, 'Revised review must NOT be clean on first pass');
    assert.equal(getFirstPassIssuesCount(genuinelyCleanReview, rules), 0, 'Clean review must be clean on first pass');

    const analytics = calculateReviewAnalytics([revisedReview, genuinelyCleanReview], rules);

    assert.equal(analytics.totalReviews, 2);
    assert.equal(analytics.totalAuditedReviews, 2);
    // Only the genuinely clean review counts as clean on first pass!
    assert.equal(analytics.cleanFirstPassCount, 1);
    assert.equal(analytics.cleanFirstPassRate, 50); // 1 of 2 = 50%
  });

  test('4. Decisions (Approve, Request Changes, Reject, Save Draft) do not erase findings or distort historical metrics', () => {
    const rules = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];

    const reviewWithViolation: ReviewItem = {
      id: 'rev_decision_test',
      title: 'Superlative Claim Test',
      author: 'Workspace Reviewer',
      channel: 'Social Media',
      status: 'Needs review',
      updatedAt: 'Just now',
      wordCount: 8,
      issuesCount: 1,
      confidenceScore: 80,
      summary: 'Flagged 1 unsupported claim.',
      originalDraft: 'We are the fastest platform in the market.',
      currentDraft: 'We are the fastest platform in the market.',
      firstPassIssuesCount: 1,
      firstPassScore: 80,
      findings: [
        {
          id: 'f1',
          ruleId: 'rule-unsupported-claims',
          ruleTitle: 'Unsupported Marketing Claims',
          ruleCategory: 'Claims & Restrictions',
          severity: 'Critical',
          matchedText: 'fastest',
          explanation: 'Superlative detected'
        }
      ]
    };

    // 1. Initial state
    const a1 = calculateReviewAnalytics([reviewWithViolation], rules);
    assert.equal(a1.cleanFirstPassRate, 0);
    assert.equal(a1.totalCurrentIssues, 1);
    assert.equal(a1.avgIssuesPerReview, '1.0');
    assert.equal(a1.statusDistribution.find((s) => s.status === 'Needs review')?.count, 1);

    // 2. Request Changes decision
    const changesRequested: ReviewItem = {
      ...reviewWithViolation,
      status: 'Changes Requested',
      reviewerComment: 'Please replace "fastest" with documented metrics.'
    };
    const a2 = calculateReviewAnalytics([changesRequested], rules);
    assert.equal(a2.cleanFirstPassRate, 0, 'First-pass rate must not change after decision');
    assert.equal(a2.totalCurrentIssues, 1, 'Findings must not be wiped');
    assert.equal(a2.statusDistribution.find((s) => s.status === 'Changes Requested')?.count, 1);

    // 3. Approve decision (even if approved with exception, findings remain)
    const approved: ReviewItem = {
      ...reviewWithViolation,
      status: 'Approved',
      reviewerComment: 'Approved with legal exception.'
    };
    const a3 = calculateReviewAnalytics([approved], rules);
    assert.equal(a3.cleanFirstPassRate, 0, 'First-pass rate must not change after approve');
    assert.equal(a3.totalCurrentIssues, 1, 'Findings must remain preserved');
    assert.equal(a3.statusDistribution.find((s) => s.status === 'Approved')?.count, 1);

    // 4. Reject decision
    const rejected: ReviewItem = {
      ...reviewWithViolation,
      status: 'Rejected',
      reviewerComment: 'Prohibited superlatives cannot be used.'
    };
    const a4 = calculateReviewAnalytics([rejected], rules);
    assert.equal(a4.cleanFirstPassRate, 0);
    assert.equal(a4.statusDistribution.find((s) => s.status === 'Rejected')?.count, 1);
  });

  test('5. Channel breakdown calculates accurate clean rates, issue counts, and handles 0 reviews gracefully', () => {
    const rules = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];

    const pressRelease1: ReviewItem = {
      id: 'r_pr_1',
      title: 'PR Draft 1',
      author: 'Workspace Reviewer',
      channel: 'Press Release',
      status: 'Needs review',
      updatedAt: 'Just now',
      wordCount: 15,
      issuesCount: 1,
      confidenceScore: 80,
      summary: '1 violation',
      originalDraft: 'BrandGuard is the most trusted solution.',
      currentDraft: 'BrandGuard is the most trusted solution.',
      firstPassIssuesCount: 1,
      findings: [
        {
          id: 'f_pr',
          ruleId: 'rule-unsupported-claims',
          ruleTitle: 'Unsupported Marketing Claims',
          ruleCategory: 'Claims & Restrictions',
          severity: 'Critical',
          matchedText: 'most trusted',
          explanation: 'Superlative'
        }
      ]
    };

    const pressRelease2: ReviewItem = {
      id: 'r_pr_2',
      title: 'PR Draft 2',
      author: 'Workspace Reviewer',
      channel: 'Press Release',
      status: 'Approved',
      updatedAt: 'Just now',
      wordCount: 20,
      issuesCount: 0,
      confidenceScore: 100,
      summary: 'Clean draft',
      originalDraft: 'BrandGuard provides policy validation tools.',
      currentDraft: 'BrandGuard provides policy validation tools.',
      firstPassIssuesCount: 0,
      findings: []
    };

    const socialDraft: ReviewItem = {
      id: 'r_soc_1',
      title: 'Social Post',
      author: 'Workspace Reviewer',
      channel: 'Social Media',
      status: 'Approved',
      updatedAt: 'Just now',
      wordCount: 8,
      issuesCount: 0,
      confidenceScore: 100,
      summary: 'Clean',
      originalDraft: 'Automate brand checks effortlessly.',
      currentDraft: 'Automate brand checks effortlessly.',
      firstPassIssuesCount: 0,
      findings: []
    };

    const analytics = calculateReviewAnalytics([pressRelease1, pressRelease2, socialDraft], rules);

    const prStat = analytics.channelBreakdown.find((c) => c.channel === 'Press Release');
    assert.ok(prStat);
    assert.equal(prStat.totalCount, 2);
    assert.equal(prStat.auditedCount, 2);
    assert.equal(prStat.cleanFirstPassCount, 1);
    assert.equal(prStat.cleanRate, 50); // 1 / 2 = 50%
    assert.equal(prStat.totalCurrentIssues, 1);
    assert.equal(prStat.avgIssues, '0.5');

    const socStat = analytics.channelBreakdown.find((c) => c.channel === 'Social Media');
    assert.ok(socStat);
    assert.equal(socStat.totalCount, 1);
    assert.equal(socStat.cleanFirstPassCount, 1);
    assert.equal(socStat.cleanRate, 100);
    assert.equal(socStat.totalCurrentIssues, 0);
    assert.equal(socStat.avgIssues, '0.0');
  });

  test('6. Top recurring policy violations aggregate actual findings from saved reviews', () => {
    const r1: ReviewItem = {
      id: 'r_v_1',
      title: 'Draft 1',
      author: 'Workspace Reviewer',
      channel: 'Press Release',
      status: 'Needs review',
      updatedAt: 'Just now',
      wordCount: 10,
      issuesCount: 1,
      confidenceScore: 80,
      summary: 'Flagged 1',
      originalDraft: 'BrandGuard is the most trusted solution.',
      currentDraft: 'BrandGuard is the most trusted solution.',
      firstPassIssuesCount: 1,
      findings: [
        {
          id: 'f1',
          ruleId: 'rule-unsupported-claims',
          ruleTitle: 'Unsupported Marketing Claims',
          ruleCategory: 'Claims & Restrictions',
          severity: 'Critical',
          matchedText: 'most trusted',
          explanation: 'Superlative'
        }
      ]
    };

    const r2: ReviewItem = {
      id: 'r_v_2',
      title: 'Draft 2',
      author: 'Workspace Reviewer',
      channel: 'Web',
      status: 'In review',
      updatedAt: 'Just now',
      wordCount: 15,
      issuesCount: 1,
      confidenceScore: 80,
      summary: 'Flagged 1',
      originalDraft: 'Guaranteed 100% immunity.',
      currentDraft: 'Guaranteed 100% immunity.',
      firstPassIssuesCount: 1,
      findings: [
        {
          id: 'f2',
          ruleId: 'rule-unsupported-claims',
          ruleTitle: 'Unsupported Marketing Claims',
          ruleCategory: 'Claims & Restrictions',
          severity: 'Critical',
          matchedText: '100% immunity',
          explanation: 'Absolute guarantee'
        }
      ]
    };

    const analytics = calculateReviewAnalytics([r1, r2]);
    assert.equal(analytics.topViolations.length, 1);
    assert.equal(analytics.topViolations[0].ruleTitle, 'Unsupported Marketing Claims');
    assert.equal(analytics.topViolations[0].count, 2);
    assert.equal(analytics.topViolations[0].severity, 'Critical');
  });

  test('7. Analytics consistency with storage and browser refresh simulation', () => {
    // 1. Initial reviews seeded from brandStorage
    const initialReviews = brandStorage.getStoredReviews();
    const initialRules = brandStorage.getStoredRules();

    const a1 = calculateReviewAnalytics(initialReviews, initialRules);
    assert.equal(a1.totalReviews >= 2, true);
    assert.ok(a1.hasAuditedData);
    assert.ok(a1.totalAuditedReviews >= 2);

    // 2. Perform a decision in storage
    const target = initialReviews[0];
    const decision: ReviewDecisionRecord = {
      id: 'dec_insights_test',
      action: 'Request Changes',
      reviewerName: 'Workspace Reviewer',
      reviewerComment: 'Please fix superlatives',
      timestamp: new Date().toISOString(),
      previousStatus: target.status,
      newStatus: 'Changes Requested'
    };

    brandStorage.saveReview({
      ...target,
      status: 'Changes Requested',
      decisionHistory: [decision, ...(target.decisionHistory || [])]
    });

    // 3. Simulate browser refresh by reading directly from storage again
    const refreshedReviews = brandStorage.getStoredReviews();
    const a2 = calculateReviewAnalytics(refreshedReviews, initialRules);

    // Assert metrics remain consistent and reflect status change without losing findings
    assert.equal(a2.totalReviews, a1.totalReviews);
    assert.equal(a2.totalAuditedReviews, a1.totalAuditedReviews);
    assert.equal(a2.cleanFirstPassRate, a1.cleanFirstPassRate);
    assert.equal(a2.totalCurrentIssues, a1.totalCurrentIssues);

    const changesRequestedCount = a2.statusDistribution.find((s) => s.status === 'Changes Requested')?.count;
    assert.ok(changesRequestedCount && changesRequestedCount >= 1);
  });

  test('8. Regression: Lifecycle of flagged draft, revision, approval, rerun, refresh, and legacy exclusion', () => {
    const rules = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];

    // 1. Initial content submission: draft contains "most trusted"
    const initialText = 'BrandGuard AI is the most trusted platform for global enterprise governance.';
    const initialEval = evaluateDraft(initialText, rules);
    assert.equal(initialEval.findings.length, 1);
    assert.equal(initialEval.findings[0].matchedText, 'most trusted');

    // Save as initial review
    const saveRes1 = brandStorage.saveReview({
      id: 'rev_lifecycle_01',
      title: 'Lifecycle Test Campaign',
      author: 'Workspace Reviewer',
      channel: 'Press Release',
      status: 'Needs review',
      wordCount: 10,
      issuesCount: initialEval.findings.length,
      confidenceScore: initialEval.score,
      summary: initialEval.summaryText,
      originalDraft: initialText,
      currentDraft: initialText,
      findings: initialEval.findings,
      firstPassFindings: initialEval.findings,
      firstPassIssuesCount: initialEval.findings.length,
      firstPassScore: initialEval.score
    });
    assert.equal(saveRes1.success, true);

    // Initial check verification in analytics
    let reviews = brandStorage.getStoredReviews();
    let r = reviews.find((item) => item.id === 'rev_lifecycle_01')!;
    assert.ok(r);
    assert.equal(r.firstPassIssuesCount, 1);
    assert.equal(r.issuesCount, 1);

    // 2. Request changes decision
    brandStorage.saveReview({
      ...r,
      status: 'Changes Requested',
      reviewerComment: 'Please remove unbacked claim "most trusted".'
    });

    reviews = brandStorage.getStoredReviews();
    r = reviews.find((item) => item.id === 'rev_lifecycle_01')!;
    assert.equal(r.status, 'Changes Requested');
    assert.equal(r.firstPassIssuesCount, 1, 'firstPassIssuesCount remains 1 after Request Changes');

    // 3. Author edits draft to remove "most trusted" and passes
    const revisedText = 'BrandGuard AI provides audited benchmark verification for global enterprise governance.';
    const revisedEval = evaluateDraft(revisedText, rules);
    assert.equal(revisedEval.findings.length, 0, 'Revised draft must have 0 findings');

    // Save revision
    brandStorage.saveReview({
      ...r,
      currentDraft: revisedText,
      findings: revisedEval.findings,
      issuesCount: 0,
      confidenceScore: 100,
      revisions: [
        {
          id: 'rev_r1',
          revisionNumber: 1,
          text: revisedText,
          editedAt: new Date().toISOString(),
          findingsCount: 0,
          score: 100
        }
      ]
    });

    reviews = brandStorage.getStoredReviews();
    r = reviews.find((item) => item.id === 'rev_lifecycle_01')!;
    assert.equal(r.issuesCount, 0, 'Current issuesCount updated to 0');
    assert.equal(r.firstPassIssuesCount, 1, 'First-pass count remains 1 after revision');
    assert.equal(r.originalDraft, initialText, 'Original draft remains unchanged');

    // 4. Repeated checks do not overwrite first-pass metrics
    const rerunEval = evaluateDraft(r.currentDraft!, rules);
    assert.equal(rerunEval.findings.length, 0);

    brandStorage.saveReview({
      ...r,
      findings: rerunEval.findings,
      issuesCount: 0,
      confidenceScore: 100
    });

    reviews = brandStorage.getStoredReviews();
    r = reviews.find((item) => item.id === 'rev_lifecycle_01')!;
    assert.equal(r.firstPassIssuesCount, 1, 'Repeated checks must NOT overwrite first-pass metrics');

    // 5. Approve decision does not overwrite first-pass metrics
    brandStorage.saveReview({
      ...r,
      status: 'Approved',
      reviewerComment: 'Revised draft is fully compliant.'
    });

    reviews = brandStorage.getStoredReviews();
    r = reviews.find((item) => item.id === 'rev_lifecycle_01')!;
    assert.equal(r.status, 'Approved');
    assert.equal(r.firstPassIssuesCount, 1, 'Approval must NOT overwrite first-pass metrics');
    assert.equal(r.issuesCount, 0, 'Current issues remain 0');

    // 6. Simulate browser refresh
    const refreshedReviews = brandStorage.getStoredReviews();
    const refreshedR = refreshedReviews.find((item) => item.id === 'rev_lifecycle_01')!;
    assert.equal(refreshedR.firstPassIssuesCount, 1, 'Refresh preserves original firstPassIssuesCount');
    assert.equal(refreshedR.issuesCount, 0);

    // 7. Verify Trends & Insights calculation:
    // This revised draft must NOT be counted as clean on first pass!
    const cleanDraft = refreshedReviews.find((item) => item.id === 'rev_enterprise_overview_02')!;
    const analytics = calculateReviewAnalytics([refreshedR, cleanDraft], rules);

    assert.equal(analytics.totalReviews, 2);
    assert.equal(analytics.totalAuditedReviews, 2);
    assert.equal(analytics.cleanFirstPassCount, 1, 'Only cleanDraft is clean on first pass; refreshedR is not');
    assert.equal(analytics.cleanFirstPassRate, 50); // 1 of 2 = 50%

    // 8. Legacy records without trustworthy first-pass data:
    const legacyStub: ReviewItem = {
      id: 'rev_legacy_unverifiable',
      title: 'Legacy Review Without Draft',
      author: 'Workspace Reviewer',
      channel: 'Web',
      status: 'Needs review',
      updatedAt: '1 year ago',
      wordCount: 0,
      issuesCount: 0, // Stored 0
      confidenceScore: 100,
      summary: 'Checked 0 issues',
      originalDraft: '', // No draft
      currentDraft: '',
      findings: []
      // firstPassIssuesCount intentionally omitted
    };

    assert.equal(getFirstPassIssuesCount(legacyStub, rules), null, 'Legacy record must have null first-pass count');

    const analyticsWithLegacy = calculateReviewAnalytics([refreshedR, cleanDraft, legacyStub], rules);
    assert.equal(analyticsWithLegacy.firstPassUnavailableCount, 1, 'Legacy stub marked firstPassUnavailable');
    // Must NOT be falsely counted as clean:
    assert.equal(analyticsWithLegacy.cleanFirstPassCount, 1);
    assert.equal(analyticsWithLegacy.firstPassVerifiableCount, 2);
    assert.equal(analyticsWithLegacy.cleanFirstPassRate, 50, 'Legacy stub excluded from first-pass rate calculation');
  });
});
