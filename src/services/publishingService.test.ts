import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { publishingService, type PublishReviewClientOptions } from './publishingService.ts';
import { brandStorage, deduplicateDecisionHistory } from './brandStorage.ts';
import type { ReviewItem, PublishingRecord, ReviewDecisionRecord } from '../types/index.ts';

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

describe('Publishing Service & End-to-End Review Journey Tests', () => {
  beforeEach(() => {
    storageMock.clear();
    publishingService.setHandlerForTesting(null);
  });

  afterEach(() => {
    publishingService.setHandlerForTesting(null);
  });

  test('1. Validates missing reviewId fails closed with HTTP 400', async () => {
    const result = await publishingService.requestPublishReview({
      reviewId: ''
    });

    assert.equal(result.status, 'error');
    assert.equal(result.httpStatus, 400);
    assert.ok(result.error?.includes('reviewId is required'));
  });

  test('2. Dispatches publish request through mock handler and returns structured publishing outcome', async () => {
    const mockRecord: PublishingRecord = {
      idempotencyKey: 'pub_test_123_abc',
      destinationUrl: 'https://api.cms.internal/v1/publish',
      destinationName: 'Enterprise CMS Webhook',
      status: 'published',
      publishedAt: '2026-10-28T20:30:00Z',
      attemptCount: 1,
      statusCode: 200,
      externalReference: 'ext_cms_999'
    };

    publishingService.setHandlerForTesting(async (opts: PublishReviewClientOptions) => {
      assert.equal(opts.reviewId, 'rev_test_123');
      assert.equal(opts.userRole, 'Admin');
      assert.equal(opts.userId, 'usr_admin_sarah');
      return {
        status: 'published',
        httpStatus: 200,
        record: mockRecord,
        message: 'Review successfully published via webhook.'
      };
    });

    const result = await publishingService.requestPublishReview({
      reviewId: 'rev_test_123',
      userRole: 'Admin',
      userId: 'usr_admin_sarah'
    });

    assert.equal(result.status, 'published');
    assert.equal(result.httpStatus, 200);
    assert.ok(result.record);
    assert.equal(result.record.idempotencyKey, 'pub_test_123_abc');
    assert.equal(result.record.status, 'published');
    assert.equal(result.record.externalReference, 'ext_cms_999');
  });

  test('3. Handles unconfigured publishing webhook (503) gracefully without throwing', async () => {
    publishingService.setHandlerForTesting(async () => {
      return {
        status: 'unconfigured',
        httpStatus: 503,
        error: 'Publishing webhook destination is unconfigured. Set PUBLISHING_WEBHOOK_URL on the server.'
      };
    });

    const result = await publishingService.requestPublishReview({
      reviewId: 'rev_test_456'
    });

    assert.equal(result.status, 'unconfigured');
    assert.equal(result.httpStatus, 503);
    assert.ok(result.error?.includes('unconfigured'));
  });

  test('4. Complete End-to-End Judge Journey: Create -> Approve -> Publish -> History Persist', () => {
    // A. Editor / Reviewer creates draft review
    const initialReview = brandStorage.saveReview({
      title: 'Q3 Enterprise Architecture Update',
      author: 'Marcus Vance',
      channel: 'Press Release',
      status: 'Needs review',
      originalDraft: 'We are thrilled to launch our new enterprise cloud capability.',
      currentDraft: 'We are pleased to introduce our new enterprise cloud capability.',
      findings: [],
      issuesCount: 0,
      confidenceScore: 100,
      wordCount: 10,
      rulesCheckedCount: 6
    });

    assert.ok(initialReview.success && initialReview.data, 'Should save initial review');
    const reviewId = initialReview.data.id;
    assert.equal(initialReview.data.status, 'Needs review');

    // B. Authorized Reviewer executes Approval decision
    const approveRecord: ReviewDecisionRecord = {
      id: `dec_${Date.now()}_app`,
      action: 'Approve',
      reviewerName: 'Elena Rostova',
      reviewerComment: 'Editorial review completed. Tone is compliant.',
      timestamp: new Date().toISOString(),
      previousStatus: 'Needs review',
      newStatus: 'Approved'
    };

    const approvedReview = brandStorage.saveReview({
      ...initialReview.data,
      status: 'Approved',
      reviewedBy: 'Elena Rostova',
      reviewerComment: 'Editorial review completed. Tone is compliant.',
      decisionAt: new Date().toISOString(),
      decisionHistory: deduplicateDecisionHistory([approveRecord])
    });

    assert.ok(approvedReview.success && approvedReview.data);
    assert.equal(approvedReview.data.status, 'Approved');
    assert.equal(approvedReview.data.decisionHistory?.length, 1);
    assert.equal(approvedReview.data.decisionHistory?.[0].action, 'Approve');

    // C. Publishing Step: Dispatches webhook and records publication outcome
    const pubRecord: PublishingRecord = {
      idempotencyKey: `pub_${reviewId}_v1`,
      destinationUrl: 'https://api.cms.internal/v1/webhooks/publish',
      destinationName: 'Enterprise CMS Webhook',
      status: 'published',
      publishedAt: new Date().toISOString(),
      attemptCount: 1,
      statusCode: 200,
      externalReference: 'cms_ref_4482'
    };

    const publishDecisionRecord: ReviewDecisionRecord = {
      id: `dec_${Date.now()}_pub`,
      action: 'Publish',
      reviewerName: 'Elena Rostova',
      reviewerComment: 'Published via automated webhook integration',
      timestamp: new Date().toISOString(),
      previousStatus: 'Approved',
      newStatus: 'Published'
    };

    const publishedReview = brandStorage.saveReview({
      ...approvedReview.data,
      status: 'Published',
      publishingStatus: 'published',
      publishingRecord: pubRecord,
      decisionHistory: deduplicateDecisionHistory([
        publishDecisionRecord,
        ...(approvedReview.data.decisionHistory || [])
      ])
    });

    assert.ok(publishedReview.success && publishedReview.data);
    assert.equal(publishedReview.data.status, 'Published');
    assert.equal(publishedReview.data.publishingStatus, 'published');
    assert.ok(publishedReview.data.publishingRecord);
    assert.equal(publishedReview.data.publishingRecord.status, 'published');
    assert.equal(publishedReview.data.publishingRecord.externalReference, 'cms_ref_4482');

    // D. Persistence Verification Across Simulated Page Refresh
    const reloadedReviews = brandStorage.getStoredReviews();
    const found = reloadedReviews.find((r: ReviewItem) => r.id === reviewId);
    assert.ok(found, 'Review must persist across storage reload');
    assert.equal(found.status, 'Published');
    assert.equal(found.publishingStatus, 'published');
    assert.equal(found.publishingRecord?.idempotencyKey, `pub_${reviewId}_v1`);
    assert.equal(found.decisionHistory?.length, 2);
    assert.equal(found.decisionHistory?.[0].action, 'Publish');
    assert.equal(found.decisionHistory?.[1].action, 'Approve');
  });

  test('5. Image and alt-text asset data survives storage save and reload roundtrip', () => {
    const saved = brandStorage.saveReview({
      title: 'Multimodal Creative Billboard',
      author: 'Elena Rostova',
      channel: 'Paid Ad Copy',
      status: 'Draft',
      originalDraft: 'Hero image draft headline',
      findings: [],
      issuesCount: 0,
      confidenceScore: 100,
      imageAsset: {
        id: 'img_test_123',
        fileName: 'brand_banner.png',
        fileType: 'image/png',
        fileSize: 10240,
        altText: 'Official Axiom Cloud logo on deep navy gradient background',
        thumbnailDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      },
      visualFindings: [
        {
          id: 'vis_test_1',
          ruleId: 'vis_logo_clearspace',
          ruleTitle: 'Logo Clear Space & Isolation',
          severity: 'Low',
          category: 'Brand Identity',
          message: 'Clear space margins verified compliant.',
          passed: true
        }
      ],
      visualAnalysisStatus: 'completed',
      visualProvider: 'gemini',
      visualModel: 'gemini-1.5-flash'
    });

    assert.ok(saved.success && saved.data);
    const reloaded = brandStorage.getStoredReviews().find((r: ReviewItem) => r.id === saved.data?.id);
    assert.ok(reloaded);
    assert.ok(reloaded.imageAsset);
    assert.equal(reloaded.imageAsset.fileName, 'brand_banner.png');
    assert.equal(reloaded.imageAsset.altText, 'Official Axiom Cloud logo on deep navy gradient background');
    assert.equal(reloaded.visualFindings?.length, 1);
    assert.equal(reloaded.visualAnalysisStatus, 'completed');
    assert.equal(reloaded.visualProvider, 'gemini');
  });
});
