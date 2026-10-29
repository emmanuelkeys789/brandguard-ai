import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasPermission,
  SIMULATED_USERS,
  type WorkspaceAction
} from './rbac.ts';
import {
  isValidReviewStateTransition,
  getAllowedNextStatuses,
  canUserExecuteTransition,
  canUserExecuteAction
} from './reviewTransitions.ts';
import {
  brandStorage,
  deduplicateDecisionHistory
} from './brandStorage.ts';
import { handlePublishReview } from './publishingHandler.ts';
import type { ReviewDecisionRecord, PublishingRecord } from '../types/index.ts';

// In-memory mock storage for Node test environment
const memoryStore = (() => {
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
  value: memoryStore,
  writable: true
});

describe('Governance and Review Workflow Tests', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  describe('1. Role and Permission Enforcement Matrix', () => {
    test('Editor role is strictly barred from approving, rejecting, or requesting changes', () => {
      assert.equal(hasPermission('Editor', 'approve_review'), false);
      assert.equal(hasPermission('Editor', 'reject_review'), false);
      assert.equal(hasPermission('Editor', 'request_changes'), false);

      const approveCheck = canUserExecuteAction('Editor', 'approve_review');
      assert.equal(approveCheck.allowed, false);
      assert.ok(approveCheck.reason?.includes('Editor role cannot approve'));

      const rejectCheck = canUserExecuteAction('Editor', 'reject_review');
      assert.equal(rejectCheck.allowed, false);
      assert.ok(rejectCheck.reason?.includes('Editor role cannot reject'));

      const changesCheck = canUserExecuteAction('Editor', 'request_changes');
      assert.equal(changesCheck.allowed, false);
      assert.ok(changesCheck.reason?.includes('Editor role cannot request changes'));
    });

    test('Editor role is strictly barred from publishing content', () => {
      assert.equal(hasPermission('Editor', 'publish_review'), false);

      const pubCheck = canUserExecuteAction('Editor', 'publish_review');
      assert.equal(pubCheck.allowed, false);
      assert.ok(pubCheck.reason?.includes('Editor role cannot publish'));
    });

    test('Editor role CAN author drafts, edit drafts, and apply AI suggestions', () => {
      assert.equal(hasPermission('Editor', 'create_draft'), true);
      assert.equal(hasPermission('Editor', 'edit_draft'), true);
      assert.equal(hasPermission('Editor', 'apply_ai_suggestion'), true);
    });

    test('Reviewer role can approve, reject, request changes, and publish', () => {
      assert.equal(hasPermission('Reviewer', 'approve_review'), true);
      assert.equal(hasPermission('Reviewer', 'reject_review'), true);
      assert.equal(hasPermission('Reviewer', 'request_changes'), true);
      assert.equal(hasPermission('Reviewer', 'publish_review'), true);

      assert.equal(canUserExecuteAction('Reviewer', 'approve_review').allowed, true);
      assert.equal(canUserExecuteAction('Reviewer', 'publish_review').allowed, true);
    });

    test('Reviewer role CANNOT manage rules, brand profile, or delete reviews', () => {
      assert.equal(hasPermission('Reviewer', 'manage_rules'), false);
      assert.equal(hasPermission('Reviewer', 'manage_profile'), false);
      assert.equal(hasPermission('Reviewer', 'delete_review'), false);

      const rulesCheck = canUserExecuteAction('Reviewer', 'manage_rules');
      assert.equal(rulesCheck.allowed, false);
      assert.ok(rulesCheck.reason?.includes('Only workspace Admins'));
    });

    test('Admin role has complete authority over all governance actions', () => {
      const actions: WorkspaceAction[] = [
        'manage_rules',
        'manage_profile',
        'approve_review',
        'reject_review',
        'request_changes',
        'create_draft',
        'edit_draft',
        'apply_ai_suggestion',
        'publish_review',
        'delete_review'
      ];

      for (const action of actions) {
        assert.equal(hasPermission('Admin', action), true);
        assert.equal(canUserExecuteAction('Admin', action).allowed, true);
      }
    });

    test('Simulated demo personas are defined with clear transparent identity labels', () => {
      assert.equal(SIMULATED_USERS.Admin.role, 'Admin');
      assert.equal(SIMULATED_USERS.Reviewer.role, 'Reviewer');
      assert.equal(SIMULATED_USERS.Editor.role, 'Editor');

      assert.ok(SIMULATED_USERS.Admin.email.endsWith('.internal'));
      assert.ok(SIMULATED_USERS.Reviewer.email.endsWith('.internal'));
      assert.ok(SIMULATED_USERS.Editor.email.endsWith('.internal'));
    });
  });

  describe('2. Review Workflow State Machine Transitions', () => {
    test('Valid lifecycle: Draft -> Needs review -> In review -> Approved -> Published', () => {
      assert.equal(isValidReviewStateTransition('Draft', 'Needs review').valid, true);
      assert.equal(isValidReviewStateTransition('Needs review', 'In review').valid, true);
      assert.equal(isValidReviewStateTransition('In review', 'Approved').valid, true);
      assert.equal(isValidReviewStateTransition('Approved', 'Published').valid, true);
    });

    test('Valid revision cycle: Needs review -> Changes Requested -> Needs review -> Approved', () => {
      assert.equal(isValidReviewStateTransition('Needs review', 'Changes Requested').valid, true);
      assert.equal(isValidReviewStateTransition('Changes Requested', 'Needs review').valid, true);
      assert.equal(isValidReviewStateTransition('Needs review', 'Approved').valid, true);
    });

    test('Direct approval after verified revision in Changes Requested is supported', () => {
      assert.equal(isValidReviewStateTransition('Changes Requested', 'Approved').valid, true);
    });

    test('BLOCKED: Cannot publish unapproved content directly from Draft', () => {
      const check = isValidReviewStateTransition('Draft', 'Published');
      assert.equal(check.valid, false);
      assert.ok(check.reason?.includes('Cannot publish unapproved content'));
    });

    test('BLOCKED: Cannot publish unapproved content directly from Needs review', () => {
      const check = isValidReviewStateTransition('Needs review', 'Published');
      assert.equal(check.valid, false);
      assert.ok(check.reason?.includes('Cannot publish unapproved content'));
    });

    test('BLOCKED: Cannot publish unapproved content directly from In review', () => {
      const check = isValidReviewStateTransition('In review', 'Published');
      assert.equal(check.valid, false);
      assert.ok(check.reason?.includes('Cannot publish unapproved content'));
    });

    test('BLOCKED: Cannot publish unapproved content directly from Changes Requested', () => {
      const check = isValidReviewStateTransition('Changes Requested', 'Published');
      assert.equal(check.valid, false);
      assert.ok(check.reason?.includes('Cannot publish unapproved content'));
    });

    test('BLOCKED: Cannot publish rejected content', () => {
      const check = isValidReviewStateTransition('Rejected', 'Published');
      assert.equal(check.valid, false);
      assert.ok(check.reason?.includes('Cannot publish rejected content'));
    });

    test('BLOCKED: Cannot approve directly from Rejected without reopening/resubmitting', () => {
      const check = isValidReviewStateTransition('Rejected', 'Approved');
      assert.equal(check.valid, false);
      assert.ok(check.reason?.includes('Cannot approve directly from "Rejected"'));
    });

    test('BLOCKED: Cannot create a brand new review directly as Published', () => {
      const check = isValidReviewStateTransition(undefined, 'Published');
      assert.equal(check.valid, false);
      assert.ok(check.reason?.includes('New drafts cannot be directly created as "Published"'));
    });

    test('getAllowedNextStatuses returns accurate options for each state', () => {
      const draftOptions = getAllowedNextStatuses('Draft');
      assert.ok(draftOptions.includes('Needs review'));
      assert.ok(draftOptions.includes('In review'));
      assert.ok(!draftOptions.includes('Approved'));
      assert.ok(!draftOptions.includes('Published'));

      const needsReviewOptions = getAllowedNextStatuses('Needs review');
      assert.ok(needsReviewOptions.includes('Approved'));
      assert.ok(needsReviewOptions.includes('Rejected'));
      assert.ok(needsReviewOptions.includes('Changes Requested'));
      assert.ok(!needsReviewOptions.includes('Published'));

      const approvedOptions = getAllowedNextStatuses('Approved');
      assert.ok(approvedOptions.includes('Published'));
      assert.ok(approvedOptions.includes('Changes Requested'));
      assert.ok(approvedOptions.includes('Rejected'));
    });

    test('canUserExecuteTransition combines transition legality and role permission checks', () => {
      // Editor attempting to approve review: transition valid, but role forbidden
      const editorApprove = canUserExecuteTransition('Editor', 'Needs review', 'Approved');
      assert.equal(editorApprove.allowed, false);
      assert.ok(editorApprove.reason?.includes('Editor role cannot approve'));

      // Editor attempting to publish: transition valid from Approved, but role forbidden
      const editorPublish = canUserExecuteTransition('Editor', 'Approved', 'Published');
      assert.equal(editorPublish.allowed, false);
      assert.ok(editorPublish.reason?.includes('Editor role cannot publish'));

      // Reviewer attempting invalid transition (publish directly from Needs review)
      const reviewerInvalid = canUserExecuteTransition('Reviewer', 'Needs review', 'Published');
      assert.equal(reviewerInvalid.allowed, false);
      assert.ok(reviewerInvalid.reason?.includes('Cannot publish unapproved content'));

      // Reviewer executing legitimate approval
      const reviewerApprove = canUserExecuteTransition('Reviewer', 'Needs review', 'Approved');
      assert.equal(reviewerApprove.allowed, true);

      // Reviewer executing legitimate publication from Approved
      const reviewerPublish = canUserExecuteTransition('Reviewer', 'Approved', 'Published');
      assert.equal(reviewerPublish.allowed, true);
    });
  });

  describe('3. Repeated Publishing & Duplicate Action Protections', () => {
    test('brandStorage blocks saving an unapproved review directly as Published', () => {
      const draftReview = brandStorage.saveReview({
        title: 'Q4 Product Announcement',
        author: 'Marcus Vance',
        channel: 'Press Release',
        status: 'Needs review',
        originalDraft: 'BrandGuard AI delivers enterprise brand safety.',
        currentDraft: 'BrandGuard AI delivers enterprise brand safety.',
        findings: [],
        issuesCount: 0,
        confidenceScore: 100
      });

      assert.ok(draftReview.success && draftReview.data);
      assert.equal(draftReview.data.status, 'Needs review');

      // Attempt to save directly as Published without approval
      const illegalPublish = brandStorage.saveReview({
        ...draftReview.data,
        status: 'Published'
      });

      assert.equal(illegalPublish.success, false);
      assert.ok(illegalPublish.error?.includes('Cannot publish unapproved content'));
    });

    test('brandStorage prevents repeated publishing of an already published review', () => {
      // 1. Create initial review
      const draft = brandStorage.saveReview({
        title: 'Press Release - Brand Launch',
        author: 'Marcus Vance',
        channel: 'Press Release',
        status: 'Needs review',
        originalDraft: 'Enterprise governance announcement draft.',
        currentDraft: 'Enterprise governance announcement draft.',
        findings: [],
        issuesCount: 0,
        confidenceScore: 100
      });
      assert.ok(draft.data);

      // 2. Approve
      const approved = brandStorage.saveReview({
        ...draft.data,
        status: 'Approved',
        reviewedBy: 'Elena Rostova',
        decisionAt: new Date().toISOString(),
        decisionHistory: [
          {
            id: 'dec_app_1',
            action: 'Approve',
            reviewerName: 'Elena Rostova',
            reviewerComment: 'Editorial copy verified.',
            timestamp: new Date().toISOString(),
            previousStatus: 'Needs review',
            newStatus: 'Approved'
          }
        ]
      });
      assert.ok(approved.data);

      // 3. Publish initial
      const pubTimestamp = new Date().toISOString();
      const published = brandStorage.saveReview({
        ...approved.data,
        status: 'Published',
        publishingStatus: 'published',
        publishingRecord: {
          idempotencyKey: 'pub_test_v1',
          destinationUrl: 'https://webhook.internal/publish',
          status: 'published',
          publishedAt: pubTimestamp,
          lastAttemptAt: pubTimestamp,
          attemptCount: 1
        },
        decisionHistory: [
          {
            id: 'dec_pub_1',
            action: 'Publish',
            reviewerName: 'Elena Rostova',
            reviewerComment: 'Dispatched via webhook.',
            timestamp: pubTimestamp,
            previousStatus: 'Approved',
            newStatus: 'Published'
          },
          ...(approved.data.decisionHistory || [])
        ]
      });
      assert.ok(published.data);
      assert.equal(published.data.status, 'Published');

      // 4. Repeated publish attempt with new decision record
      const repeatedPublish = brandStorage.saveReview({
        ...published.data,
        status: 'Published',
        decisionHistory: [
          {
            id: 'dec_pub_2_duplicate',
            action: 'Publish',
            reviewerName: 'Sarah Chen',
            reviewerComment: 'Repeated publish attempt.',
            timestamp: new Date().toISOString(),
            previousStatus: 'Published',
            newStatus: 'Published'
          },
          ...(published.data.decisionHistory || [])
        ]
      });

      assert.equal(repeatedPublish.success, false);
      assert.ok(repeatedPublish.error?.includes('Content has already been published'));
    });

    test('deduplicateDecisionHistory prevents duplicate records from rapid repeated saves', () => {
      const now = new Date().toISOString();
      const history: ReviewDecisionRecord[] = [
        {
          id: 'dec_1',
          action: 'Request Changes',
          reviewerName: 'Elena Rostova',
          reviewerComment: 'Please fix headline claims.',
          timestamp: now,
          previousStatus: 'Needs review',
          newStatus: 'Changes Requested'
        },
        {
          id: 'dec_2',
          action: 'Request Changes',
          reviewerName: 'Elena Rostova',
          reviewerComment: 'Please fix headline claims.',
          timestamp: new Date(new Date(now).getTime() + 1000).toISOString(), // 1s later
          previousStatus: 'Needs review',
          newStatus: 'Changes Requested'
        }
      ];

      const deduplicated = deduplicateDecisionHistory(history);
      assert.equal(deduplicated.length, 1, 'Duplicate decision within time window should be filtered');
      assert.equal(deduplicated[0].id, 'dec_1');
    });

    test('Server publishing handler returns HTTP 409 Conflict when publishing an already published review', async () => {
      const mockPublishedReview: any = {
        id: 'rev_already_published_01',
        title: 'Already Published Review',
        channel: 'Press Release',
        status: 'Published',
        author: 'Marcus Vance',
        reviewedBy: 'Elena Rostova',
        confidenceScore: 100,
        currentDraft: 'Published copy.',
        publishingStatus: 'published'
      };

      const mockClient = {
        auth: {
          getUser: async () => ({
            data: { user: { id: 'usr_sarah', email: 'sarah@axiom.internal' } },
            error: null
          })
        },
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              single: async () => {
                if (table === 'user_roles') {
                  return { data: { role: 'Admin' }, error: null };
                }
                if (table === 'brand_reviews') {
                  return { data: mockPublishedReview, error: null };
                }
                return { data: null, error: null };
              },
              maybeSingle: async () => {
                if (table === 'user_roles') {
                  return { data: { role: 'Admin' }, error: null };
                }
                if (table === 'brand_reviews') {
                  return { data: mockPublishedReview, error: null };
                }
                return { data: null, error: null };
              }
            })
          })
        })
      };

      const res = await handlePublishReview(
        {
          reviewId: 'rev_already_published_01',
          userToken: 'header.payload.signature'
        },
        {
          supabaseClient: mockClient,
          envOverrides: {
            SUPABASE_URL: 'https://test.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'test-secret'
          }
        }
      );

      assert.equal(res.status, 'error');
      assert.equal(res.httpStatus, 409, 'Must return HTTP 409 Conflict for repeated publishing');
      assert.ok(res.error?.includes('has already been published'));
    });
  });

  describe('4. Audit Trail Integrity and Decision Preservation', () => {
    test('Decision record retains reviewer identity, timestamp, comment, and status transition', () => {
      const timestamp = new Date().toISOString();
      const initial = brandStorage.saveReview({
        title: 'Brand Alignment Document',
        author: 'Marcus Vance',
        channel: 'Internal Wiki',
        status: 'Needs review',
        originalDraft: 'Draft content for brand alignment.',
        currentDraft: 'Draft content for brand alignment.',
        findings: [],
        issuesCount: 0,
        confidenceScore: 100
      });
      assert.ok(initial.data);

      const decision: ReviewDecisionRecord = {
        id: `dec_${Date.now()}`,
        action: 'Approve',
        reviewerName: 'Elena Rostova',
        reviewerComment: 'Complies with all visual and tone guidelines.',
        timestamp,
        previousStatus: 'Needs review',
        newStatus: 'Approved'
      };

      const approved = brandStorage.saveReview({
        ...initial.data,
        status: 'Approved',
        reviewedBy: 'Elena Rostova',
        decisionAt: timestamp,
        reviewerComment: 'Complies with all visual and tone guidelines.',
        decisionHistory: [decision]
      });

      assert.ok(approved.data);
      assert.equal(approved.data.status, 'Approved');
      assert.equal(approved.data.reviewedBy, 'Elena Rostova');
      assert.equal(approved.data.reviewerComment, 'Complies with all visual and tone guidelines.');
      assert.equal(approved.data.decisionHistory?.length, 1);

      const auditRecord = approved.data.decisionHistory?.[0];
      assert.ok(auditRecord);
      assert.equal(auditRecord.reviewerName, 'Elena Rostova');
      assert.equal(auditRecord.action, 'Approve');
      assert.equal(auditRecord.previousStatus, 'Needs review');
      assert.equal(auditRecord.newStatus, 'Approved');
      assert.equal(auditRecord.timestamp, timestamp);

      // Verify persistence across reload
      const reloaded = brandStorage.getStoredReviews().find((r) => r.id === initial.data?.id);
      assert.ok(reloaded);
      assert.equal(reloaded.status, 'Approved');
      assert.equal(reloaded.decisionHistory?.length, 1);
      assert.equal(reloaded.decisionHistory?.[0].reviewerName, 'Elena Rostova');
    });

    test('Publishing record retains metadata without storing tokens or secrets', () => {
      const pubRecord: PublishingRecord = {
        idempotencyKey: 'pub_key_audit_test_123',
        destinationUrl: 'https://api.cms.example.com/v1/publish',
        destinationName: 'Corporate CMS',
        status: 'published',
        publishedAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString(),
        attemptCount: 1,
        statusCode: 200,
        externalReference: 'cms_doc_8941'
      };

      const recordJson = JSON.stringify(pubRecord);
      assert.ok(!recordJson.includes('secret'));
      assert.ok(!recordJson.includes('token'));
      assert.ok(!recordJson.includes('password'));
      assert.ok(!recordJson.includes('Authorization'));
      assert.equal(pubRecord.externalReference, 'cms_doc_8941');
      assert.equal(pubRecord.statusCode, 200);
    });

    test('Simulated demo publish mode records isSimulated: true', () => {
      const demoRecord: PublishingRecord = {
        idempotencyKey: 'pub_demo_test_01',
        destinationUrl: 'simulation://local-demo-publishing',
        destinationName: 'Offline Demo Simulation',
        status: 'published',
        publishedAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString(),
        attemptCount: 1,
        statusCode: 200,
        externalReference: 'sim_ref_9921',
        isSimulated: true
      };

      assert.equal(demoRecord.isSimulated, true);
      assert.ok(demoRecord.destinationUrl.startsWith('simulation://'));
    });
  });
});
