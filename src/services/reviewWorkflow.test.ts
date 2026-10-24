import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDraft,
  calculateComplianceScore,
  getFindingRuleMetadata,
  type ReviewFinding
} from './ruleEngine.ts';
import {
  brandStorage,
  DEFAULT_UNSUPPORTED_CLAIMS_RULE,
  isSummaryText,
  deduplicateDecisionHistory
} from './brandStorage.ts';
import type { BrandRule, ReviewDecisionRecord } from '../types/index.ts';

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

describe('Human Review and Approval Workflow Tests', () => {
  beforeEach(() => {
    storageMock.clear();
  });

  test('1. Open an existing saved review and inspect full audit fields', () => {
    // When storage is empty, brandStorage seeds initial saved reviews
    const reviews = brandStorage.getStoredReviews();
    assert.ok(reviews.length >= 2, 'Should provide saved initial reviews');

    const firstReview = reviews[0];
    assert.ok(firstReview.id, 'Review should have stable ID');
    assert.ok(firstReview.title, 'Review should have title');
    assert.ok(firstReview.channel, 'Review should have channel');
    assert.ok(firstReview.originalDraft, 'Review should have original draft captured');
    assert.ok(firstReview.status, 'Review should have status');
    assert.ok(Array.isArray(firstReview.findings), 'Review should have findings list');
    assert.equal(firstReview.status, 'Needs review', 'Initial review requires human review');
  });

  test('2. Request changes and confirm the status and comment persist after refresh', () => {
    const reviews = brandStorage.getStoredReviews();
    const target = reviews[0];

    const comment = 'Please remove unverified superlative claims from headline before release.';
    const decision: ReviewDecisionRecord = {
      id: `dec_${Date.now()}`,
      action: 'Request Changes',
      reviewerName: 'Workspace Reviewer',
      reviewerComment: comment,
      timestamp: new Date().toISOString(),
      previousStatus: target.status,
      newStatus: 'Changes Requested'
    };

    const updateResult = brandStorage.saveReview({
      ...target,
      status: 'Changes Requested',
      reviewerComment: comment,
      decisionAt: decision.timestamp,
      decisionHistory: [decision, ...(target.decisionHistory || [])]
    });

    assert.equal(updateResult.success, true, 'Save review should succeed');

    // Simulate browser refresh by re-reading localStorage directly
    const reloadedReviews = brandStorage.getStoredReviews();
    const persisted = reloadedReviews.find((r) => r.id === target.id);

    assert.ok(persisted, 'Review should be found after reload');
    assert.equal(persisted.status, 'Changes Requested', 'Status should persist as Changes Requested');
    assert.equal(persisted.reviewerComment, comment, 'Reviewer comment should persist');
    assert.ok(persisted.decisionHistory && persisted.decisionHistory.length > 0, 'Decision history should persist');
    assert.equal(persisted.decisionHistory[0].action, 'Request Changes');
  });

  test('3. Edit the draft, save a revision, and rerun the check', () => {
    const rules: BrandRule[] = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];
    const initialText = 'BrandGuard AI is the most trusted and fastest brand platform, guaranteeing 100% immunity.';

    // 1. Initial check flags violations
    const initialResult = evaluateDraft(initialText, rules);
    assert.ok(initialResult.findings.length > 0, 'Initial draft should trigger findings');
    assert.ok(initialResult.score < 100, 'Score should have deductions');

    // 2. Reviewer edits draft to remove superlatives
    const revisedText = 'BrandGuard AI helps teams maintain brand governance with audited performance metrics.';

    // 3. Rerun rule engine on revised draft
    const revisedResult = evaluateDraft(revisedText, rules);
    assert.equal(revisedResult.findings.length, 0, 'Revised draft should have 0 findings');
    assert.equal(revisedResult.score, 100, 'Revised draft score should be 100% compliant');

    // 4. Save revision
    const target = brandStorage.getStoredReviews()[0];
    const updateResult = brandStorage.saveReview({
      ...target,
      currentDraft: revisedText,
      findings: revisedResult.findings,
      issuesCount: revisedResult.findings.length,
      confidenceScore: revisedResult.score,
      revisions: [
        {
          id: 'rev_1',
          revisionNumber: 1,
          text: revisedText,
          editedAt: new Date().toISOString(),
          findingsCount: 0,
          score: 100
        }
      ]
    });

    assert.equal(updateResult.success, true);
    const refreshed = brandStorage.getStoredReviews().find((r) => r.id === target.id);
    assert.equal(refreshed?.currentDraft, revisedText, 'Revised draft should be stored');
    assert.equal(refreshed?.issuesCount, 0, 'Issues count should be 0');
  });

  test('4. Approve a review and confirm the status persists', () => {
    const reviews = brandStorage.getStoredReviews();
    const target = reviews[1]; // compliant draft

    const decision: ReviewDecisionRecord = {
      id: `dec_${Date.now()}`,
      action: 'Approve',
      reviewerName: 'Workspace Reviewer',
      reviewerComment: 'Editorial copy verified and approved for publishing.',
      timestamp: new Date().toISOString(),
      previousStatus: target.status,
      newStatus: 'Approved'
    };

    brandStorage.saveReview({
      ...target,
      status: 'Approved',
      decisionAt: decision.timestamp,
      decisionHistory: [decision, ...(target.decisionHistory || [])]
    });

    const refreshed = brandStorage.getStoredReviews().find((r) => r.id === target.id);
    assert.equal(refreshed?.status, 'Approved', 'Status must persist as Approved');
    assert.ok(refreshed?.decisionAt, 'Decision timestamp must be set');
  });

  test('5. Reject a review and confirm the status persists', () => {
    const reviews = brandStorage.getStoredReviews();
    const target = reviews[0];

    const decision: ReviewDecisionRecord = {
      id: `dec_${Date.now()}`,
      action: 'Reject',
      reviewerName: 'Workspace Reviewer',
      reviewerComment: 'Fails mandatory corporate claim substantiation guidelines.',
      timestamp: new Date().toISOString(),
      previousStatus: target.status,
      newStatus: 'Rejected'
    };

    brandStorage.saveReview({
      ...target,
      status: 'Rejected',
      reviewerComment: decision.reviewerComment,
      decisionAt: decision.timestamp,
      decisionHistory: [decision, ...(target.decisionHistory || [])]
    });

    const refreshed = brandStorage.getStoredReviews().find((r) => r.id === target.id);
    assert.equal(refreshed?.status, 'Rejected', 'Status must persist as Rejected');
    assert.equal(refreshed?.reviewerComment, 'Fails mandatory corporate claim substantiation guidelines.');
  });

  test('6. Confirm the original draft remains available after revisions', () => {
    const reviews = brandStorage.getStoredReviews();
    const target = reviews[0];
    const immutableOriginal = target.originalDraft;

    assert.ok(immutableOriginal, 'Original draft must exist initially');

    // Make multiple edits to currentDraft
    brandStorage.saveReview({
      ...target,
      currentDraft: 'Draft Revision #1: slight edits made.'
    });

    brandStorage.saveReview({
      ...target,
      currentDraft: 'Draft Revision #2: further changes made.'
    });

    const refreshed = brandStorage.getStoredReviews().find((r) => r.id === target.id);
    assert.equal(refreshed?.currentDraft, 'Draft Revision #2: further changes made.');
    assert.equal(
      refreshed?.originalDraft,
      immutableOriginal,
      'Original draft must remain completely unchanged and preserved'
    );
  });

  test('7. Confirm finding category and severity match the exact saved rule ID and handle deleted rules', () => {
    const rules: BrandRule[] = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];

    // Finding triggered by Unsupported Marketing Claims
    const sampleFinding: ReviewFinding = {
      id: 'finding_test_1',
      ruleId: DEFAULT_UNSUPPORTED_CLAIMS_RULE.id,
      ruleTitle: DEFAULT_UNSUPPORTED_CLAIMS_RULE.title,
      ruleCategory: 'Approved Facts', // Intentionally mismatched to verify dynamic resolution
      severity: 'Low', // Intentionally mismatched
      matchedText: 'most trusted',
      explanation: 'Test violation'
    };

    // Metadata must be derived dynamically from exact saved rule
    const meta = getFindingRuleMetadata(sampleFinding, rules);
    assert.equal(meta.isRuleAvailable, true, 'Rule should be marked available');
    assert.equal(meta.category, 'Claims & Restrictions', 'Category must match saved rule (Claims & Restrictions)');
    assert.equal(meta.severity, 'Critical', 'Severity must match saved rule (Critical)');
    assert.equal(meta.ruleTitle, 'Unsupported Marketing Claims');

    // Case: rule has been deleted or is missing
    const missingRuleFinding: ReviewFinding = {
      id: 'finding_test_2',
      ruleId: 'deleted_rule_xyz',
      ruleTitle: 'Old Obsolete Rule',
      ruleCategory: 'Prohibited Terms',
      severity: 'High',
      explanation: 'Deleted rule finding'
    };

    const unavailableMeta = getFindingRuleMetadata(missingRuleFinding, rules);
    assert.equal(unavailableMeta.isRuleAvailable, false, 'Deleted rule must be marked unavailable');
    assert.equal(unavailableMeta.category, 'Unavailable Rule', 'Must clearly show Unavailable Rule');
  });

  test('8. Confirm score calculations are meaningful and deterministic', () => {
    // 0 findings -> 100
    assert.equal(calculateComplianceScore([]), 100);

    // 1 Critical finding (-20) -> 80
    assert.equal(calculateComplianceScore([{ severity: 'Critical' }]), 80);

    // 1 High finding (-12) -> 88
    assert.equal(calculateComplianceScore([{ severity: 'High' }]), 88);

    // 1 Medium/Warning finding (-8) -> 92
    assert.equal(calculateComplianceScore([{ severity: 'Medium' }]), 92);
    assert.equal(calculateComplianceScore([{ severity: 'Warning' }]), 92);

    // 1 Low/Advisory finding (-4) -> 96
    assert.equal(calculateComplianceScore([{ severity: 'Low' }]), 96);

    // Multiple findings combined: 100 - (20 + 12 + 8) = 60
    assert.equal(
      calculateComplianceScore([
        { severity: 'Critical' },
        { severity: 'High' },
        { severity: 'Medium' }
      ]),
      60
    );

    // Score is clamped at 0
    assert.equal(
      calculateComplianceScore([
        { severity: 'Critical' },
        { severity: 'Critical' },
        { severity: 'Critical' },
        { severity: 'Critical' },
        { severity: 'Critical' },
        { severity: 'Critical' }
      ]),
      0
    );
  });

  test('9. Confirm existing reviews remain available and no duplicate records are created', () => {
    const initialReviews = brandStorage.getStoredReviews();
    const initialCount = initialReviews.length;
    const target = initialReviews[0];

    // Update existing review 3 times
    brandStorage.saveReview({ ...target, title: 'Updated Title Once' });
    brandStorage.saveReview({ ...target, title: 'Updated Title Twice' });
    brandStorage.saveReview({ ...target, title: 'Updated Title Three Times' });

    const afterUpdates = brandStorage.getStoredReviews();
    assert.equal(
      afterUpdates.length,
      initialCount,
      'Updating an existing review must NOT create duplicate records'
    );
    assert.equal(
      afterUpdates.find((r) => r.id === target.id)?.title,
      'Updated Title Three Times',
      'Latest update must be applied in place'
    );

    // Add a genuinely new review
    const newReview = brandStorage.saveReview({
      title: 'Brand New Unique Review',
      author: 'Workspace Reviewer',
      channel: 'Customer Newsletter',
      status: 'Needs review',
      wordCount: 120,
      issuesCount: 0,
      confidenceScore: 100,
      summary: 'Clean check'
    });

    assert.equal(newReview.success, true);
    const afterInsert = brandStorage.getStoredReviews();
    assert.equal(afterInsert.length, initialCount + 1, 'New review should increment review count by 1');
    assert.ok(afterInsert.some((r) => r.id === newReview.data?.id), 'New review must be present');
    assert.ok(afterInsert.some((r) => r.id === target.id), 'Original review must still be present');
  });

  test('10. Workflow: draft triggering rule -> Request Changes -> refresh -> findings persist, score not 100%, edit draft -> rerun check -> findings update to 0', () => {
    const rules = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];
    const draftText = 'BrandGuard AI is the most trusted enterprise brand platform in the world.';

    // 1. Initial check flags rule violation
    const initialEval = evaluateDraft(draftText, rules);
    assert.equal(initialEval.findings.length, 1, 'Should detect 1 unsupported claim violation');
    assert.equal(initialEval.score, 80, 'Score should be 80% due to Critical violation');

    // 2. Save new review
    const saveRes = brandStorage.saveReview({
      title: 'Test Review 1',
      author: 'Workspace Reviewer',
      channel: 'Press Release',
      status: 'Needs review',
      originalDraft: draftText,
      currentDraft: draftText,
      findings: initialEval.findings,
      issuesCount: initialEval.findings.length,
      confidenceScore: initialEval.score,
      summary: initialEval.summaryText,
      wordCount: 12
    });
    assert.equal(saveRes.success, true);
    const savedId = saveRes.data?.id;
    assert.ok(savedId);

    // 3. Reviewer executes "Request Changes"
    const reqComment = 'Please remove superlatives and provide citations.';
    const decision: ReviewDecisionRecord = {
      id: `dec_${Date.now()}`,
      action: 'Request Changes',
      reviewerName: 'Workspace Reviewer',
      reviewerComment: reqComment,
      timestamp: new Date().toISOString(),
      previousStatus: 'Needs review',
      newStatus: 'Changes Requested'
    };

    // Save with status change without rerun
    const updated = brandStorage.saveReview({
      ...saveRes.data!,
      status: 'Changes Requested',
      reviewerComment: reqComment,
      decisionAt: decision.timestamp,
      decisionHistory: [decision, ...(saveRes.data?.decisionHistory || [])]
    });
    assert.equal(updated.success, true);

    // 4. Simulate browser refresh by reading directly from storage
    const reloadedReviews = brandStorage.getStoredReviews();
    const persisted = reloadedReviews.find((r) => r.id === savedId);
    assert.ok(persisted, 'Review must be in storage');

    // 5. Confirm findings, issue count, and score are preserved and NOT reset to 0 / 100%
    assert.equal(persisted.status, 'Changes Requested');
    assert.equal(persisted.findings?.length, 1, 'Finding must NOT be erased by status change');
    assert.equal(persisted.issuesCount, 1, 'issuesCount must remain 1');
    assert.equal(persisted.confidenceScore, 80, 'Score must remain 80% (not reset to 100%)');
    assert.equal(persisted.originalDraft, draftText, 'Original draft must be preserved');

    // 6. Author edits the draft
    const revisedText = 'BrandGuard AI provides brand governance with audited third-party metrics.';
    const rerunEval = evaluateDraft(revisedText, rules);
    assert.equal(rerunEval.findings.length, 0, 'Revised draft must have 0 findings');
    assert.equal(rerunEval.score, 100, 'Revised draft score must be 100%');

    // 7. Save revised draft and rerun results
    const revisedSave = brandStorage.saveReview({
      ...persisted,
      currentDraft: revisedText,
      findings: rerunEval.findings,
      issuesCount: rerunEval.findings.length,
      confidenceScore: rerunEval.score,
      revisions: [
        {
          id: 'rev_1',
          revisionNumber: 1,
          text: revisedText,
          editedAt: new Date().toISOString(),
          findingsCount: 0,
          score: 100
        }
      ]
    });
    assert.equal(revisedSave.success, true);

    // 8. Re-read from storage to verify complete consistency
    const finalReload = brandStorage.getStoredReviews().find((r) => r.id === savedId);
    assert.ok(finalReload);
    assert.equal(finalReload.currentDraft, revisedText, 'Latest draft must be updated');
    assert.equal(finalReload.originalDraft, draftText, 'Original draft must be immutably preserved');
    assert.equal(finalReload.findings?.length, 0, 'Findings updated to 0');
    assert.equal(finalReload.issuesCount, 0, 'issuesCount updated to 0');
    assert.equal(finalReload.confidenceScore, 100, 'Score updated to 100%');
    assert.equal(finalReload.revisions?.length, 1, 'Revision history must be preserved');
  });

  test('11. Compliant draft test: clean draft only shows 0 findings when engine returns 0 findings', () => {
    const rules = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];
    const compliantText = 'BrandGuard helps cross-functional teams review public copy prior to release with verified policies.';

    // Run deterministic engine
    const evalResult = evaluateDraft(compliantText, rules);
    assert.equal(evalResult.findings.length, 0, 'Engine must return 0 findings for compliant draft');
    assert.equal(evalResult.score, 100, 'Engine must return 100% score');

    const saveRes = brandStorage.saveReview({
      title: 'Summer Launch Campaign — Test 2',
      author: 'Workspace Reviewer',
      channel: 'Product Overview',
      status: 'Needs review',
      originalDraft: compliantText,
      currentDraft: compliantText,
      findings: evalResult.findings,
      issuesCount: evalResult.findings.length,
      confidenceScore: evalResult.score,
      summary: evalResult.summaryText,
      wordCount: 15
    });
    assert.equal(saveRes.success, true);

    // Approve the compliant review
    const approveDecision: ReviewDecisionRecord = {
      id: `dec_${Date.now()}`,
      action: 'Approve',
      reviewerName: 'Workspace Reviewer',
      reviewerComment: 'Editorial copy verified and approved.',
      timestamp: new Date().toISOString(),
      previousStatus: 'Needs review',
      newStatus: 'Approved'
    };

    brandStorage.saveReview({
      ...saveRes.data!,
      status: 'Approved',
      decisionAt: approveDecision.timestamp,
      decisionHistory: [approveDecision]
    });

    // Verify after refresh
    const refreshed = brandStorage.getStoredReviews().find((r) => r.id === saveRes.data?.id);
    assert.ok(refreshed);
    assert.equal(refreshed.status, 'Approved');
    assert.equal(refreshed.findings?.length, 0, 'Compliant review has 0 findings');
    assert.equal(refreshed.issuesCount, 0, 'issuesCount is 0');
    assert.equal(refreshed.confidenceScore, 100, 'Score is 100%');
  });

  test('12. Human decision does not erase findings: approving a review with findings retains findings and actual score', () => {
    const rules = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];
    const draftText = 'BrandGuard is the fastest platform available.';

    const evalResult = evaluateDraft(draftText, rules);
    assert.equal(evalResult.findings.length, 1);
    assert.equal(evalResult.score, 80);

    const saved = brandStorage.saveReview({
      title: 'Policy Exception Review',
      author: 'Workspace Reviewer',
      channel: 'Social Media',
      status: 'Needs review',
      originalDraft: draftText,
      currentDraft: draftText,
      findings: evalResult.findings,
      issuesCount: 1,
      confidenceScore: 80,
      summary: 'Flagged 1 violation'
    });
    assert.equal(saved.success, true);

    // Human reviewer approves with documented override comment
    const approveDecision: ReviewDecisionRecord = {
      id: `dec_${Date.now()}`,
      action: 'Approve',
      reviewerName: 'Senior Legal Reviewer',
      reviewerComment: 'Approved with legal exception granted under §4.2 audit waiver.',
      timestamp: new Date().toISOString(),
      previousStatus: 'Needs review',
      newStatus: 'Approved'
    };

    // Save with status Approved, preserving findings
    brandStorage.saveReview({
      ...saved.data!,
      status: 'Approved',
      reviewerComment: approveDecision.reviewerComment,
      decisionAt: approveDecision.timestamp,
      decisionHistory: [approveDecision]
    });

    const refreshed = brandStorage.getStoredReviews().find((r) => r.id === saved.data?.id);
    assert.ok(refreshed);
    assert.equal(refreshed.status, 'Approved', 'Status is Approved');
    assert.equal(refreshed.findings?.length, 1, 'Findings must NOT be erased because review was approved');
    assert.equal(refreshed.issuesCount, 1, 'issuesCount must remain 1');
    assert.equal(
      refreshed.confidenceScore,
      80,
      'Score must NOT become 100% merely because review was approved; must reflect actual findings'
    );
  });

  test('13. Rehydration from storage: reviews without findings array rehydrate from saved rules without data loss', () => {
    // Manually write a raw review object to localStorage simulating legacy record
    const legacyItem = {
      id: 'legacy_rev_999',
      title: 'Legacy Draft Review',
      author: 'Workspace Reviewer',
      channel: 'Web',
      status: 'In review',
      updatedAt: '1 day ago',
      originalDraft: 'BrandGuard is the most trusted solution.',
      currentDraft: 'BrandGuard is the most trusted solution.'
      // findings and issuesCount intentionally omitted
    };

    globalThis.localStorage.setItem('brandguard_brand_reviews', JSON.stringify([legacyItem]));

    // Read through brandStorage.getStoredReviews()
    const reviews = brandStorage.getStoredReviews();
    const loaded = reviews.find((r) => r.id === 'legacy_rev_999');
    assert.ok(loaded);
    assert.ok(Array.isArray(loaded.findings), 'findings must be rehydrated into array');
    assert.equal(loaded.findings.length, 1, 'Should identify violation from saved rules');
    assert.equal(loaded.issuesCount, 1, 'issuesCount must match findings.length');
    assert.equal(loaded.confidenceScore, 80, 'Score must be calculated from findings');
  });

  test('14. Never use review summary text as draft content, and restore marketing draft for Test Review 1 if corrupted', () => {
    // Write an entry for "Test Review 1" where originalDraft and currentDraft were corrupted with summary text
    const corruptedReview = {
      id: 'rev_test_review_1',
      title: 'Test Review 1',
      author: 'Workspace Reviewer',
      channel: 'Press Release',
      status: 'Changes Requested',
      updatedAt: 'Just now',
      wordCount: 12,
      issuesCount: 0,
      confidenceScore: 100,
      summary: 'Flagged 1 unsupported marketing claim ("most trusted and fastest brand platform").',
      originalDraft: 'Flagged 1 unsupported marketing claim ("most trusted and fastest brand platform").',
      currentDraft: 'Flagged 1 unsupported marketing claim ("most trusted and fastest brand platform").',
      findings: []
    };

    globalThis.localStorage.setItem('brandguard_brand_reviews', JSON.stringify([corruptedReview]));

    const reviews = brandStorage.getStoredReviews();
    const restored = reviews.find((r) => r.id === 'rev_test_review_1');
    assert.ok(restored);

    // Assert that summary text is NOT used as draft content
    assert.equal(isSummaryText(restored.originalDraft), false, 'Original draft must not be summary text');
    assert.equal(isSummaryText(restored.currentDraft), false, 'Current draft must not be summary text');

    // Assert marketing content was restored
    assert.ok(
      restored.originalDraft.includes('most trusted'),
      'Original submitted marketing content must be restored'
    );

    // Assert finding is restored matching the draft and rules
    assert.equal(restored.findings?.length, 1, 'Findings must match draft ("most trusted")');
    assert.equal(restored.findings![0].matchedText, 'most trusted');
    assert.equal(restored.findings![0].ruleTitle, 'Unsupported Marketing Claims');
    assert.equal(restored.findings![0].ruleCategory, 'Claims & Restrictions');
    assert.equal(restored.findings![0].severity, 'Critical');
    assert.equal(restored.issuesCount, 1);
    assert.equal(restored.confidenceScore, 80);
  });

  test('15. If original content is genuinely unavailable, preserve as empty without inventing content', () => {
    // Review with genuinely no marketing content and no known ID match
    const genuinelyEmpty = {
      id: 'rev_custom_random_99',
      title: 'Custom Random Mystery Draft',
      author: 'Workspace Reviewer',
      channel: 'Blog',
      status: 'Needs review',
      summary: 'Flagged 0 issues.',
      originalDraft: 'Flagged 0 issues.', // corrupted with summary
      currentDraft: '',
      findings: []
    };

    globalThis.localStorage.setItem('brandguard_brand_reviews', JSON.stringify([genuinelyEmpty]));

    const reviews = brandStorage.getStoredReviews();
    const loaded = reviews.find((r) => r.id === 'rev_custom_random_99');
    assert.ok(loaded);
    // Never use summary text as draft, and never fabricate content
    assert.equal(loaded.originalDraft, '', 'Should be empty string representing unavailable draft');
    assert.equal(isSummaryText(loaded.originalDraft), false);
  });

  test('16. Audit history deduplication: repeated Request Changes calls produce only one audit record', () => {
    const reviews = brandStorage.getStoredReviews();
    const target = reviews[0];

    const comment = 'Please remove superlatives.';
    const decision1: ReviewDecisionRecord = {
      id: 'dec_dup_1',
      action: 'Request Changes',
      reviewerName: 'Workspace Reviewer',
      reviewerComment: comment,
      timestamp: '2026-10-23T06:00:00.000Z',
      previousStatus: 'Needs review',
      newStatus: 'Changes Requested'
    };

    // Duplicate call with exact same action and timestamp
    const decision2: ReviewDecisionRecord = {
      id: 'dec_dup_2',
      action: 'Request Changes',
      reviewerName: 'Workspace Reviewer',
      reviewerComment: comment,
      timestamp: '2026-10-23T06:00:01.000Z', // 1s later
      previousStatus: 'Needs review',
      newStatus: 'Changes Requested'
    };

    // Save with duplicate decisions
    const res = brandStorage.saveReview({
      ...target,
      decisionHistory: [decision2, decision1, ...(target.decisionHistory || [])]
    });

    assert.equal(res.success, true);
    const dedupedDirect = deduplicateDecisionHistory([decision2, decision1]);
    assert.equal(dedupedDirect.length, 1, 'deduplicateDecisionHistory helper should collapse duplicate entries');

    const refreshed = brandStorage.getStoredReviews().find((r) => r.id === target.id);
    assert.ok(refreshed);

    // Confirm duplicate was deduplicated into a single entry
    const matchingReqChanges = refreshed.decisionHistory?.filter(
      (d) => d.action === 'Request Changes' && d.reviewerComment === comment
    );
    assert.equal(matchingReqChanges?.length, 1, 'Only one audit entry should be preserved for repeated action');
  });

  test('17. Comprehensive full workflow: create draft, request changes, verify finding, rerun engine, and refresh', () => {
    const rules = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];
    const initialText = 'BrandGuard AI is the most trusted solution for global enterprises.';

    // 1. Initial check flags "most trusted"
    const eval1 = evaluateDraft(initialText, rules);
    assert.equal(eval1.findings.length, 1);
    assert.equal(eval1.score, 80);

    // 2. Save review
    const saveRes = brandStorage.saveReview({
      title: 'Full Workflow Review',
      author: 'Workspace Reviewer',
      channel: 'Web',
      status: 'Needs review',
      originalDraft: initialText,
      currentDraft: initialText,
      findings: eval1.findings,
      issuesCount: 1,
      confidenceScore: 80,
      summary: eval1.summaryText
    });
    assert.equal(saveRes.success, true);
    const revId = saveRes.data!.id;

    // 3. Request Changes
    const reqDecision: ReviewDecisionRecord = {
      id: 'dec_wf_1',
      action: 'Request Changes',
      reviewerName: 'Workspace Reviewer',
      reviewerComment: 'Need benchmark citation.',
      timestamp: '2026-10-23T07:00:00.000Z',
      previousStatus: 'Needs review',
      newStatus: 'Changes Requested'
    };

    brandStorage.saveReview({
      ...saveRes.data!,
      status: 'Changes Requested',
      reviewerComment: reqDecision.reviewerComment,
      decisionAt: reqDecision.timestamp,
      decisionHistory: [reqDecision]
    });

    // 4. Verify finding remains after status change and refresh
    let refreshed = brandStorage.getStoredReviews().find((r) => r.id === revId);
    assert.ok(refreshed);
    assert.equal(refreshed.status, 'Changes Requested');
    assert.equal(refreshed.findings?.length, 1, 'Finding must remain intact after Request Changes');
    assert.equal(refreshed.originalDraft, initialText, 'Original draft must remain unchanged');
    assert.equal(refreshed.confidenceScore, 80);

    // 5. Edit draft and rerun check
    const compliantText = 'BrandGuard AI provides audited brand governance for global enterprises.';
    const eval2 = evaluateDraft(compliantText, rules);
    assert.equal(eval2.findings.length, 0);
    assert.equal(eval2.score, 100);

    // 6. Save revision
    brandStorage.saveReview({
      ...refreshed,
      currentDraft: compliantText,
      findings: eval2.findings,
      issuesCount: 0,
      confidenceScore: 100,
      revisions: [
        {
          id: 'rev_rec_1',
          revisionNumber: 1,
          text: compliantText,
          editedAt: new Date().toISOString(),
          findingsCount: 0,
          score: 100
        }
      ]
    });

    // 7. Re-read from storage
    refreshed = brandStorage.getStoredReviews().find((r) => r.id === revId);
    assert.ok(refreshed);
    assert.equal(refreshed.originalDraft, initialText, 'Original draft must be immutably preserved');
    assert.equal(refreshed.currentDraft, compliantText, 'Current draft must be updated revision');
    assert.equal(refreshed.findings?.length, 0, 'Findings updated to 0');
    assert.equal(refreshed.issuesCount, 0);
    assert.equal(refreshed.confidenceScore, 100);
    assert.equal(refreshed.revisions?.length, 1);
  });
});
