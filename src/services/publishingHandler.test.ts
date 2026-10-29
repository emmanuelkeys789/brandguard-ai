import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  handlePublishReview,
  validateWebhookUrl,
  isPrivateOrReservedHost,
  generateStableIdempotencyKey,
  createHmacSignature,
  buildPublishingPayload,
  type PublishingServerRequest
} from './publishingHandler.ts';
import type { AuthoritativeReview } from './serverSupabaseClient.ts';

const adminJwt = 'header.payload_admin.sig';
const reviewerJwt = 'header.payload_reviewer.sig';
const editorJwt = 'header.payload_editor.sig';
const noRoleJwt = 'header.payload_norole.sig';
const expiredJwt = 'header.payload_expired.sig';

const sampleApprovedReview: AuthoritativeReview = {
  id: 'rev_approved_01',
  brandId: 'brand_axiom_01',
  title: 'Q3 Enterprise AI Governance Whitepaper',
  author: 'Sarah Chen',
  channel: 'Website & Blog',
  status: 'Approved',
  updatedAt: '2026-10-28T12:00:00.000Z',
  decisionAt: '2026-10-28T12:00:00.000Z',
  reviewedBy: 'Elena Rostova',
  wordCount: 850,
  issuesCount: 0,
  confidenceScore: 100,
  currentDraft: 'BrandGuard AI delivers authoritative enterprise compliance automation across content channels.',
  originalDraft: 'BrandGuard AI delivers authoritative enterprise compliance automation across content channels.',
  decisionHistory: [
    {
      id: 'dec_1',
      action: 'Approve',
      reviewerName: 'Elena Rostova',
      timestamp: '2026-10-28T12:00:00.000Z'
    }
  ]
};

const sampleUnapprovedReview: AuthoritativeReview = {
  id: 'rev_unapproved_02',
  brandId: 'brand_axiom_01',
  title: 'Draft in Progress',
  author: 'Marcus Vance',
  channel: 'LinkedIn',
  status: 'Needs review',
  updatedAt: '2026-10-28T10:00:00.000Z',
  wordCount: 200,
  issuesCount: 0,
  confidenceScore: 100,
  currentDraft: 'Initial marketing draft awaiting human review.',
  decisionHistory: []
};

const sampleApprovedNoApprover: AuthoritativeReview = {
  id: 'rev_no_approver_03',
  title: 'Corrupted Approval Draft',
  channel: 'Press Release',
  status: 'Approved',
  author: 'Marcus Vance',
  currentDraft: 'Content with status approved but no human signoff record.',
  confidenceScore: 100,
  issuesCount: 0,
  wordCount: 150,
  decisionHistory: [] // No 'Approve' action, and reviewedBy is undefined
};

const defaultRolesMap: Record<string, string> = {
  'usr_admin_123': 'Admin',
  'usr_reviewer_456': 'Reviewer',
  'usr_editor_789': 'Editor'
  // usr_norole_000 is intentionally omitted
};

function createMockSupabase(
  reviewsMap: Record<string, any> = { [sampleApprovedReview.id]: sampleApprovedReview },
  rolesMap: Record<string, string> = defaultRolesMap,
  tableErrors?: { user_roles?: { message: string }; brand_reviews?: { message: string } }
) {
  let updatedRecord: any = null;

  return {
    auth: {
      getUser: async (token: string) => {
        if (token === adminJwt) {
          return {
            data: {
              user: {
                id: 'usr_admin_123',
                email: 'sarah.chen@axiom-governance.internal'
              }
            },
            error: null
          };
        }
        if (token === reviewerJwt) {
          return {
            data: {
              user: {
                id: 'usr_reviewer_456',
                email: 'elena.rostova@axiom-governance.internal'
              }
            },
            error: null
          };
        }
        if (token === editorJwt) {
          return {
            data: {
              user: {
                id: 'usr_editor_789',
                email: 'marcus.vance@axiom-governance.internal'
              }
            },
            error: null
          };
        }
        if (token === noRoleJwt) {
          return {
            data: {
              user: {
                id: 'usr_norole_000',
                email: 'guest@axiom-governance.internal'
              }
            },
            error: null
          };
        }
        if (token === expiredJwt) {
          return {
            data: { user: null },
            error: { message: 'JWT expired: token expired at 2026-10-28T00:00:00Z' }
          };
        }
        return {
          data: { user: null },
          error: { message: 'Invalid token signature' }
        };
      }
    },
    from: (table: string) => {
      if (table === 'user_roles') {
        if (tableErrors?.user_roles) {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: tableErrors.user_roles
                })
              })
            })
          };
        }
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => ({
                data: rolesMap[val] ? { role: rolesMap[val] } : null,
                error: null
              })
            })
          })
        };
      }
      if (table === 'brand_reviews') {
        if (tableErrors?.brand_reviews) {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: tableErrors.brand_reviews
                })
              })
            })
          };
        }
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => ({
                data: reviewsMap[val] || null,
                error: null
              })
            })
          }),
          update: (payload: any) => ({
            eq: (_col: string, val: string) => {
              updatedRecord = { id: val, ...payload };
              return { error: null };
            }
          })
        };
      }
      throw new Error(`Unexpected table queried: "${table}"`);
    },
    getUpdatedRecord: () => updatedRecord
  };
}

const defaultEnv = {
  PUBLISHING_WEBHOOK_ENABLED: 'true',
  PUBLISHING_WEBHOOK_URL: 'https://api.cms.example.com/webhooks/publish',
  PUBLISHING_WEBHOOK_SECRET: 'super-secret-hmac-key-999',
  NODE_ENV: 'test'
};

describe('Refactored Publishing Backend (Trusted Identity & Authoritative Review State)', () => {
  describe('1. Verified Authentication (Fail-Closed Token Enforcement)', () => {
    it('rejects forged role headers (X-User-Role: Admin) when no Bearer token is provided', async () => {
      const mockDb = createMockSupabase();
      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userRole: 'Admin' // forged role header without token
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb
      });

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 401);
      assert.match(result.error || '', /Missing or invalid authentication token/i);
    });

    it('rejects invalid or expired tokens with HTTP 401', async () => {
      const mockDb = createMockSupabase();
      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: `Bearer ${expiredJwt}`
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb
      });

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 401);
      assert.match(result.error || '', /JWT expired/i);
    });

    it('rejects malformed token strings that do not follow 3-segment JWT syntax', async () => {
      const mockDb = createMockSupabase();
      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: 'Bearer malformed.token'
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb
      });

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 401);
      assert.match(result.error || '', /Malformed authentication token/i);
    });
  });

  describe('2. Persistent Trusted Role Authorization (Server-Side user_roles Enforcement)', () => {
    it('completely ignores client-supplied X-User-Role when verified user has no role in user_roles', async () => {
      let webhookCalled = false;
      const mockFetch: typeof fetch = async () => {
        webhookCalled = true;
        return new Response('{}', { status: 200 });
      };

      const mockDb = createMockSupabase();
      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: `Bearer ${noRoleJwt}`, // verified identity with no row in user_roles
        userRole: 'Admin' // client attempt to self-escalate role
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb,
        fetchFn: mockFetch
      });

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 403);
      assert.match(result.error || '', /No role assigned for user/i);
      assert.equal(webhookCalled, false, 'Webhook must NOT be dispatched when user lacks trusted role');
    });

    it('rejects verified users with Editor role from user_roles with HTTP 403 and does not dispatch webhook', async () => {
      let webhookCalled = false;
      const mockFetch: typeof fetch = async () => {
        webhookCalled = true;
        return new Response('{}', { status: 200 });
      };

      const mockDb = createMockSupabase();
      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: `Bearer ${editorJwt}`
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb,
        fetchFn: mockFetch
      });

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 403);
      assert.match(result.error || '', /User role "Editor" is not permitted to publish reviews/i);
      assert.equal(webhookCalled, false, 'Webhook must NOT be dispatched for Editor role');
    });

    it('authorizes verified Reviewer role resolved authoritatively from user_roles', async () => {
      let webhookCalled = false;
      const mockFetch: typeof fetch = async () => {
        webhookCalled = true;
        return new Response(JSON.stringify({ id: 'webhook_ok_1' }), { status: 200 });
      };

      const mockDb = createMockSupabase();
      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: `Bearer ${reviewerJwt}`
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb,
        fetchFn: mockFetch
      });

      assert.equal(result.status, 'published');
      assert.equal(result.httpStatus, 200);
      assert.equal(result.verifiedUserId, 'usr_reviewer_456');
      assert.equal(webhookCalled, true, 'Webhook must be dispatched for authorized Reviewer');
    });

    it('authorizes verified Admin role resolved authoritatively from user_roles', async () => {
      let webhookCalled = false;
      const mockFetch: typeof fetch = async () => {
        webhookCalled = true;
        return new Response(JSON.stringify({ id: 'webhook_ok_2' }), { status: 200 });
      };

      const mockDb = createMockSupabase();
      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: `Bearer ${adminJwt}`
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb,
        fetchFn: mockFetch
      });

      assert.equal(result.status, 'published');
      assert.equal(result.httpStatus, 200);
      assert.equal(result.verifiedUserId, 'usr_admin_123');
      assert.equal(webhookCalled, true, 'Webhook must be dispatched for authorized Admin');
    });

    it('fails closed with HTTP 500 when database error or missing user_roles table occurs', async () => {
      let webhookCalled = false;
      const mockFetch: typeof fetch = async () => {
        webhookCalled = true;
        return new Response('{}', { status: 200 });
      };

      const mockDb = createMockSupabase(
        { [sampleApprovedReview.id]: sampleApprovedReview },
        defaultRolesMap,
        { user_roles: { message: 'relation "public.user_roles" does not exist' } }
      );

      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: `Bearer ${adminJwt}`
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb,
        fetchFn: mockFetch
      });

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 500);
      assert.match(result.error || '', /relation "public.user_roles" does not exist/i);
      assert.equal(webhookCalled, false, 'Webhook must NEVER be dispatched when database role query fails');
    });

    it('ignores client-supplied reviewerName or forged body fields', async () => {
      let capturedBody: any = null;
      const mockFetch: typeof fetch = async (_url, init) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(JSON.stringify({ id: 'webhook_ok_tamper' }), { status: 200 });
      };

      const mockDb = createMockSupabase();
      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: `Bearer ${reviewerJwt}`,
        reviewerName: 'Forged Reviewer Name in Request Body',
        userRole: 'Admin'
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb,
        fetchFn: mockFetch
      });

      assert.equal(result.status, 'published');
      assert.equal(result.httpStatus, 200);
      // Approver must come from database (Elena Rostova), not client-supplied string
      assert.equal(capturedBody?.approvedBy, 'Elena Rostova');
    });

    it('authorizes user when trustedRoleResolver dependency injection is used', async () => {
      const mockFetch: typeof fetch = async () =>
        new Response(JSON.stringify({ id: 'webhook_ok_3' }), { status: 200 });

      const mockDb = createMockSupabase();
      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: `Bearer ${noRoleJwt}` // no role in database
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb,
        fetchFn: mockFetch,
        trustedRoleResolver: async (user) => {
          assert.equal(user.userId, 'usr_norole_000');
          return 'Reviewer'; // server-side resolved role
        }
      });

      assert.equal(result.status, 'published');
      assert.equal(result.httpStatus, 200);
    });
  });

  describe('3. Authoritative Database Review State & Content Integrity', () => {
    it('rejects missing or empty reviewId with HTTP 400', async () => {
      const mockDb = createMockSupabase();
      const result = await handlePublishReview(
        { reviewId: '', userToken: `Bearer ${adminJwt}` },
        { envOverrides: defaultEnv, supabaseClient: mockDb }
      );

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 400);
      assert.match(result.error || '', /reviewId is required/i);
    });

    it('returns HTTP 404 when reviewId does not exist in the authoritative database', async () => {
      const mockDb = createMockSupabase();
      const result = await handlePublishReview(
        { reviewId: 'rev_nonexistent', userToken: `Bearer ${adminJwt}` },
        { envOverrides: defaultEnv, supabaseClient: mockDb }
      );

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 404);
      assert.match(result.error || '', /was not found in the authoritative database/i);
    });

    it('rejects non-approved authoritative database records even if AI score is 100', async () => {
      const mockDb = createMockSupabase({
        [sampleUnapprovedReview.id]: sampleUnapprovedReview
      });

      const result = await handlePublishReview(
        { reviewId: 'rev_unapproved_02', userToken: `Bearer ${adminJwt}` },
        { envOverrides: defaultEnv, supabaseClient: mockDb }
      );

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 400);
      assert.match(result.error || '', /authoritative review status is "Needs review"/i);
      assert.match(result.error || '', /Compliance scores or AI findings alone never authorize publication/i);
    });

    it('rejects client attempt to tamper with review status in the request body', async () => {
      // Database has rev_unapproved_02 as 'Needs review'
      const mockDb = createMockSupabase({
        [sampleUnapprovedReview.id]: sampleUnapprovedReview
      });

      const req: PublishingServerRequest = {
        reviewId: 'rev_unapproved_02',
        userToken: `Bearer ${adminJwt}`,
        review: {
          ...sampleUnapprovedReview,
          status: 'Approved' // Client forged status in JSON body!
        } as any
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb
      });

      // Must inspect authoritative DB status, rejecting client tampering
      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 400);
      assert.match(result.error || '', /authoritative review status is "Needs review"/i);
    });

    it('constructs publishing payload strictly from database content, ignoring client-supplied draft text', async () => {
      let sentPayload: any = null;
      const mockFetch: typeof fetch = async (_url, init) => {
        sentPayload = JSON.parse(String(init?.body || '{}'));
        return new Response(JSON.stringify({ id: 'msg_tamper_safe' }), { status: 200 });
      };

      const mockDb = createMockSupabase();

      const req: PublishingServerRequest = {
        reviewId: 'rev_approved_01',
        userToken: `Bearer ${adminJwt}`,
        review: {
          ...sampleApprovedReview,
          title: 'FORGED CLIENT TITLE',
          currentDraft: 'FORGED MALICIOUS DRAFT IN CLIENT REQUEST'
        } as any
      };

      const result = await handlePublishReview(req, {
        envOverrides: defaultEnv,
        supabaseClient: mockDb,
        fetchFn: mockFetch
      });

      assert.equal(result.status, 'published');
      assert.equal(sentPayload.reviewId, 'rev_approved_01');
      assert.equal(sentPayload.title, sampleApprovedReview.title);
      assert.equal(sentPayload.content, sampleApprovedReview.currentDraft);
      assert.notEqual(sentPayload.content, 'FORGED MALICIOUS DRAFT IN CLIENT REQUEST');
      assert.notEqual(sentPayload.title, 'FORGED CLIENT TITLE');
    });

    it('rejects approved authoritative review that lacks an explicit human approver', async () => {
      const mockDb = createMockSupabase({
        [sampleApprovedNoApprover.id]: sampleApprovedNoApprover
      });

      const result = await handlePublishReview(
        { reviewId: 'rev_no_approver_03', userToken: `Bearer ${adminJwt}` },
        { envOverrides: defaultEnv, supabaseClient: mockDb }
      );

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 400);
      assert.match(result.error || '', /lacks a verified human approver/i);
    });
  });

  describe('4. Webhook Configuration & SSRF Protections', () => {
    it('returns 503 unconfigured when PUBLISHING_WEBHOOK_ENABLED is false', async () => {
      const mockDb = createMockSupabase();
      const result = await handlePublishReview(
        { reviewId: 'rev_approved_01', userToken: `Bearer ${adminJwt}` },
        {
          envOverrides: { ...defaultEnv, PUBLISHING_WEBHOOK_ENABLED: 'false' },
          supabaseClient: mockDb
        }
      );

      assert.equal(result.status, 'unconfigured');
      assert.equal(result.httpStatus, 503);
      assert.match(result.error || '', /disabled/i);
    });

    it('rejects client attempt to override webhook URL with arbitrary destination', async () => {
      const mockDb = createMockSupabase();
      const result = await handlePublishReview(
        {
          reviewId: 'rev_approved_01',
          userToken: `Bearer ${adminJwt}`,
          destinationUrl: 'https://attacker.evil.corp/steal'
        },
        { envOverrides: defaultEnv, supabaseClient: mockDb }
      );

      assert.equal(result.status, 'error');
      assert.equal(result.httpStatus, 400);
      assert.match(result.error || '', /Destination override forbidden/i);
    });

    it('aborts HTTP 301/302 redirects to prevent open-redirect SSRF', async () => {
      const mockRedirectFetch: typeof fetch = async () =>
        new Response(null, {
          status: 302,
          headers: { Location: 'http://169.254.169.254/latest/meta-data/' }
        });

      const mockDb = createMockSupabase();
      const result = await handlePublishReview(
        { reviewId: 'rev_approved_01', userToken: `Bearer ${adminJwt}` },
        {
          envOverrides: defaultEnv,
          supabaseClient: mockDb,
          fetchFn: mockRedirectFetch
        }
      );

      assert.equal(result.status, 'failed');
      assert.equal(result.httpStatus, 502);
      assert.match(result.error || '', /Automatic redirects are disallowed to prevent SSRF vulnerabilities/i);
    });

    it('rejects loopback, link-local, and private subnets via isPrivateOrReservedHost', () => {
      assert.equal(isPrivateOrReservedHost('localhost'), true);
      assert.equal(isPrivateOrReservedHost('127.0.0.1'), true);
      assert.equal(isPrivateOrReservedHost('169.254.169.254'), true);
      assert.equal(isPrivateOrReservedHost('10.0.1.25'), true);
      assert.equal(isPrivateOrReservedHost('192.168.1.1'), true);
      assert.equal(isPrivateOrReservedHost('api.cms.example.com'), false);
    });

    it('strictly requires HTTPS in production mode via validateWebhookUrl', () => {
      const httpCheck = validateWebhookUrl('http://api.cms.example.com/webhook', true);
      assert.equal(httpCheck.valid, false);
      assert.match(httpCheck.error || '', /HTTPS is strictly required in production/i);

      const httpsCheck = validateWebhookUrl('https://api.cms.example.com/webhook', true);
      assert.equal(httpsCheck.valid, true);
    });
  });

  describe('5. Delivery Outcomes, Database Persistence & Idempotency', () => {
    it('successfully publishes review, generates HMAC header, and persists outcome to database', async () => {
      let sentHeaders: any = null;
      let sentBody: any = null;

      const mockSuccessFetch: typeof fetch = async (_url, init) => {
        sentHeaders = init?.headers;
        sentBody = JSON.parse(String(init?.body || '{}'));
        return new Response(JSON.stringify({ id: 'ext_post_999' }), { status: 200 });
      };

      const mockDb = createMockSupabase();
      const result = await handlePublishReview(
        { reviewId: 'rev_approved_01', userToken: `Bearer ${adminJwt}` },
        {
          envOverrides: defaultEnv,
          supabaseClient: mockDb,
          fetchFn: mockSuccessFetch
        }
      );

      assert.equal(result.status, 'published');
      assert.equal(result.httpStatus, 200);
      assert.equal(result.record?.status, 'published');
      assert.equal(result.record?.externalReference, 'ext_post_999');

      // Verify HMAC header
      const expectedHmac = createHmacSignature(JSON.stringify(sentBody), defaultEnv.PUBLISHING_WEBHOOK_SECRET);
      assert.equal(sentHeaders['X-BrandGuard-Signature'], `sha256=${expectedHmac}`);

      // Verify persistence call was made to PostgreSQL
      const persisted = mockDb.getUpdatedRecord();
      assert.ok(persisted);
      assert.equal(persisted.id, 'rev_approved_01');
      assert.equal(persisted.status, 'Published');
      assert.equal(persisted.publishing_status, 'published');
      assert.equal(persisted.publishing_record?.externalReference, 'ext_post_999');
    });

    it('handles remote webhook 500 error, persists failed outcome, and avoids setting status to Published', async () => {
      const mock500Fetch: typeof fetch = async () =>
        new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      const mockDb = createMockSupabase();
      const result = await handlePublishReview(
        { reviewId: 'rev_approved_01', userToken: `Bearer ${adminJwt}` },
        {
          envOverrides: defaultEnv,
          supabaseClient: mockDb,
          fetchFn: mock500Fetch
        }
      );

      assert.equal(result.status, 'failed');
      assert.equal(result.httpStatus, 502);
      assert.match(result.error || '', /HTTP 500/i);

      // Verify database persistence of failure
      const persisted = mockDb.getUpdatedRecord();
      assert.ok(persisted);
      assert.equal(persisted.publishing_status, 'failed');
      assert.notEqual(persisted.status, 'Published'); // Must NOT change review status to Published
    });

    it('reuses existing idempotencyKey on retry of failed publication attempt', async () => {
      const initialKey = 'pub_stable_key_retry_789';
      const reviewWithFailedRecord: AuthoritativeReview = {
        ...sampleApprovedReview,
        publishingRecord: {
          idempotencyKey: initialKey,
          destinationUrl: defaultEnv.PUBLISHING_WEBHOOK_URL,
          status: 'failed',
          lastAttemptAt: '2026-10-28T09:00:00.000Z',
          attemptCount: 1,
          error: 'Network connection reset'
        }
      };

      let capturedPayload: any = null;
      const mockSuccessFetch: typeof fetch = async (_url, init) => {
        capturedPayload = JSON.parse(String(init?.body || '{}'));
        return new Response(JSON.stringify({ id: 'ext_retry_done' }), { status: 200 });
      };

      const mockDb = createMockSupabase({
        [reviewWithFailedRecord.id]: reviewWithFailedRecord
      });

      const result = await handlePublishReview(
        { reviewId: reviewWithFailedRecord.id, userToken: `Bearer ${adminJwt}` },
        {
          envOverrides: defaultEnv,
          supabaseClient: mockDb,
          fetchFn: mockSuccessFetch
        }
      );

      assert.equal(result.status, 'published');
      assert.equal(result.record?.idempotencyKey, initialKey);
      assert.equal(capturedPayload.idempotencyKey, initialKey);
      assert.equal(result.record?.attemptCount, 2);
    });

    it('never leaks webhook secret or user tokens in response objects', async () => {
      const mockDb = createMockSupabase();
      const mockFetch: typeof fetch = async () =>
        new Response(JSON.stringify({ id: 'ok' }), { status: 200 });

      const result = await handlePublishReview(
        { reviewId: 'rev_approved_01', userToken: `Bearer ${adminJwt}` },
        {
          envOverrides: defaultEnv,
          supabaseClient: mockDb,
          fetchFn: mockFetch
        }
      );

      const jsonStr = JSON.stringify(result);
      assert.equal(jsonStr.includes(defaultEnv.PUBLISHING_WEBHOOK_SECRET), false);
      assert.equal(jsonStr.includes(adminJwt), false);
    });

    it('deterministic key generator creates identical keys across multiple invocations', () => {
      const key1 = generateStableIdempotencyKey(sampleApprovedReview);
      const key2 = generateStableIdempotencyKey(sampleApprovedReview);
      assert.equal(key1, key2);
      assert.match(key1, /^pub_rev_approved_01_[a-f0-9]{16}$/);
    });

    it('buildPublishingPayload strictly strips unapproved client metadata and formats minimal contract', () => {
      const payload = buildPublishingPayload(sampleApprovedReview, 'pub_test_123');
      assert.equal(payload.idempotencyKey, 'pub_test_123');
      assert.equal(payload.reviewId, 'rev_approved_01');
      assert.equal(payload.title, sampleApprovedReview.title);
      assert.equal(payload.content, sampleApprovedReview.currentDraft);
      assert.equal(payload.hasImageAsset, false);
    });
  });
});

