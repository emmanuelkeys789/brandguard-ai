declare const process: { env?: Record<string, string | undefined> } | undefined;

import crypto from 'node:crypto';
import type { ReviewItem, PublishingRecord } from '../types/index.ts';
import { hasPermission, type UserRole } from './rbac.ts';
import {
  verifyServerAuth,
  fetchAuthoritativeUserRole,
  fetchAuthoritativeReview,
  updateAuthoritativePublishingRecord,
  type AuthoritativeReview,
  type VerifiedServerUser
} from './serverSupabaseClient.ts';

export interface PublishingServerRequest {
  reviewId?: string;
  userToken?: string;
  destinationUrl?: string;
  // Deprecated/untrusted client inputs (strictly ignored for authorization & review content)
  userRole?: UserRole;
  userId?: string;
  review?: ReviewItem;
}

export interface PublishingServerResponse {
  status: 'published' | 'failed' | 'unconfigured' | 'error';
  httpStatus: number;
  record?: PublishingRecord;
  message?: string;
  error?: string;
  sanitizedPayload?: Record<string, unknown>;
  verifiedUserId?: string;
}

export type TrustedRoleResolver = (
  user: VerifiedServerUser
) => Promise<UserRole | null> | UserRole | null;

export interface PublishingHandlerOptions {
  envOverrides?: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
  isProduction?: boolean;
  timeoutMs?: number;
  supabaseClient?: any;
  trustedRoleResolver?: TrustedRoleResolver;
}

function getEnv(key: string, overrides?: Record<string, string | undefined>): string | undefined {
  if (overrides && key in overrides) {
    return overrides[key];
  }
  if (typeof process !== 'undefined' && process?.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Checks whether a hostname or IP address resolves to a private, loopback,
 * link-local, multicast, cloud metadata, or reserved non-public address.
 * Prevents SSRF attacks by rejecting targets that could access local/cloud resources.
 */
export function isPrivateOrReservedHost(hostname: string): boolean {
  if (!hostname || typeof hostname !== 'string') return true;
  const lower = hostname.toLowerCase().trim();

  // Strip IPv6 brackets if present e.g. [::1] -> ::1
  const cleanHost = lower.startsWith('[') && lower.endsWith(']')
    ? lower.slice(1, -1)
    : lower;

  // Direct special keywords & loopback
  if (
    cleanHost === 'localhost' ||
    cleanHost.endsWith('.localhost') ||
    cleanHost === '127.0.0.1' ||
    cleanHost === '0.0.0.0' ||
    cleanHost === '::1' ||
    cleanHost === '::'
  ) {
    return true;
  }

  // Cloud metadata and internal service endpoints
  if (
    cleanHost === '169.254.169.254' ||
    cleanHost === 'metadata.google.internal' ||
    cleanHost === 'metadata' ||
    cleanHost === 'instance-data'
  ) {
    return true;
  }

  // Local and reserved TLDs
  if (
    cleanHost.endsWith('.local') ||
    cleanHost.endsWith('.internal') ||
    cleanHost.endsWith('.lan') ||
    cleanHost.endsWith('.home') ||
    cleanHost.endsWith('.corp') ||
    cleanHost.endsWith('.test') ||
    cleanHost.endsWith('.example') ||
    cleanHost.endsWith('.invalid')
  ) {
    return true;
  }

  // IPv4 dotted quad check
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = cleanHost.match(ipv4Regex);
  if (match) {
    const [, s1, s2, s3, s4] = match;
    const o1 = Number(s1);
    const o2 = Number(s2);
    const o3 = Number(s3);
    const o4 = Number(s4);

    if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) {
      return true; // invalid IP format, fail closed
    }

    // 0.0.0.0/8 (Broadcast/This network)
    if (o1 === 0) return true;

    // 127.0.0.0/8 (Loopback)
    if (o1 === 127) return true;

    // 10.0.0.0/8 (Private)
    if (o1 === 10) return true;

    // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (o1 === 192 && o2 === 168) return true;

    // 169.254.0.0/16 (Link-local)
    if (o1 === 169 && o2 === 254) return true;

    // 100.64.0.0/10 (Carrier-Grade NAT)
    if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (o1 === 192 && o2 === 0 && o3 === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1)
    if (o1 === 192 && o2 === 0 && o3 === 2) return true;

    // 198.51.100.0/24 (TEST-NET-2)
    if (o1 === 198 && o2 === 51 && o3 === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3)
    if (o1 === 203 && o2 === 0 && o3 === 113) return true;

    // 224.0.0.0/4 (Multicast: 224 - 239)
    if (o1 >= 224 && o1 <= 239) return true;

    // 240.0.0.0/4 (Reserved / Future Use: 240 - 255)
    if (o1 >= 240) return true;
  }

  // IPv6 address checks
  // Link-local: fe80::/10 (fe80 to febf)
  if (/^fe[89ab][0-9a-f]/i.test(cleanHost)) return true;

  // Unique local addresses: fc00::/7 (fc00:: to fdff::)
  if (/^f[cd][0-9a-f]{2}:/i.test(cleanHost)) return true;

  // IPv4-mapped IPv6 address: ::ffff:127.0.0.1
  if (cleanHost.includes('::ffff:')) {
    const parts = cleanHost.split('::ffff:');
    if (parts[1] && isPrivateOrReservedHost(parts[1])) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a webhook URL for safety, allowed protocol, and SSRF prevention.
 * Strictly requires HTTPS in production runtime.
 */
export function validateWebhookUrl(
  urlStr: string,
  isProduction = false
): { valid: boolean; error?: string; url?: URL } {
  if (!urlStr || typeof urlStr !== 'string' || !urlStr.trim()) {
    return { valid: false, error: 'Webhook URL is missing or empty.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr.trim());
  } catch {
    return { valid: false, error: 'Webhook URL is malformed or invalid.' };
  }

  // Protocol validation
  if (isProduction) {
    if (parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Insecure webhook destination: HTTPS is strictly required in production runtime.'
      };
    }
  } else {
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        valid: false,
        error: `Unsupported webhook protocol "${parsed.protocol}". Only HTTPS (and HTTP in development/testing) is permitted.`
      };
    }
  }

  // SSRF check on hostname
  if (isPrivateOrReservedHost(parsed.hostname)) {
    return {
      valid: false,
      error: `Unsafe webhook destination: Non-public, loopback, or private host "${parsed.hostname}" is rejected to prevent SSRF vulnerabilities.`
    };
  }

  // Ensure port is standard or safe if specified
  if (parsed.port) {
    const portNum = Number(parsed.port);
    const dangerousPorts = [21, 22, 23, 25, 53, 110, 143, 3306, 5432, 6379, 11211, 27017];
    if (dangerousPorts.includes(portNum)) {
      return {
        valid: false,
        error: `Webhook destination port ${portNum} is restricted for security.`
      };
    }
  }

  return { valid: true, url: parsed };
}

/**
 * Derives a stable, deterministic idempotency key for the publication attempt.
 * If the review already has an existing idempotencyKey from a previous attempt,
 * it is preserved and reused across retries.
 * Never uses dynamic timestamps to generate new keys on retries.
 */
export function generateStableIdempotencyKey(
  review: {
    id: string;
    decisionAt?: string;
    updatedAt?: string;
    currentDraft?: string;
    originalDraft?: string;
    publishingRecord?: PublishingRecord;
  }
): string {
  // Preserve and reuse existing key if present
  if (
    review.publishingRecord?.idempotencyKey &&
    typeof review.publishingRecord.idempotencyKey === 'string' &&
    review.publishingRecord.idempotencyKey.trim()
  ) {
    return review.publishingRecord.idempotencyKey.trim();
  }

  // Derive stable deterministic key from review's immutable approval state and draft content
  const approvalAnchor = review.decisionAt || review.updatedAt || 'approved_v1';
  const contentDigest = crypto
    .createHash('sha256')
    .update(`${review.id}:${approvalAnchor}:${review.currentDraft || review.originalDraft || ''}`)
    .digest('hex')
    .slice(0, 16);

  return `pub_${review.id}_${contentDigest}`;
}

/**
 * Computes an HMAC-SHA256 signature for the publishing payload.
 */
export function createHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Extracts a sanitized external reference identifier returned by the publishing webhook.
 * Never invents a fake external reference.
 */
function extractExternalReference(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const obj = data as Record<string, unknown>;
  const candidate = obj.externalReference || obj.externalId || obj.id || obj.reference || obj.publishedId;
  if (typeof candidate === 'string' && candidate.trim()) {
    // Sanitize to alphanumeric + safe punctuation, max 128 chars
    const sanitized = candidate.trim().slice(0, 128).replace(/[^a-zA-Z0-9_\-.:]/g, '');
    return sanitized || undefined;
  }
  if (typeof candidate === 'number') {
    return String(candidate);
  }
  return undefined;
}

/**
 * Constructs the minimal necessary publishing payload strictly from authoritative database fields.
 * Never includes unverified client content, raw base64 data, or internal storage tokens.
 */
export function buildPublishingPayload(
  review: AuthoritativeReview | ReviewItem,
  idempotencyKey: string
): Record<string, unknown> {
  return {
    idempotencyKey,
    reviewId: review.id,
    title: review.title,
    channel: review.channel,
    content: review.currentDraft || review.originalDraft || '',
    author: review.author,
    approvedBy: review.reviewedBy || 'Authorized Reviewer',
    approvedAt: review.decisionAt || review.updatedAt,
    complianceScore: review.confidenceScore,
    hasImageAsset: Boolean(
      (review as any).imageAsset ||
      (review as any).image_file_name ||
      (review as any).hasImageAsset
    ),
    timestamp: new Date().toISOString()
  };
}

/**
 * Core server-side publishing handler.
 * Enforces:
 * 1. Cryptographic token verification via Supabase Auth (verifyServerAuth).
 * 2. Trusted role authorization (fails closed if no trusted role source is configured).
 * 3. Authoritative review lookup from database (fetchAuthoritativeReview by reviewId).
 * 4. Authoritative human approval gate (verifies database status === 'Approved' and explicit approver).
 * 5. Complete disregard of client-supplied X-User-Role, body.userRole, and client review content.
 * 6. Server-side environment checks (PUBLISHING_WEBHOOK_URL, PUBLISHING_WEBHOOK_SECRET, PUBLISHING_WEBHOOK_ENABLED).
 * 7. SSRF and destination override protections (blocks private IPs, prevents arbitrary destination overrides).
 * 8. Safe redirects and timeout controls (manual redirect blocking, 15s timeout).
 * 9. Deterministic idempotency key reuse on retries.
 * 10. Database persistence of publication outcomes.
 */
export async function handlePublishReview(
  request: PublishingServerRequest,
  options?: PublishingHandlerOptions
): Promise<PublishingServerResponse> {
  // 1. Validate request structure and review identifier
  const reviewId = (request?.reviewId || request?.review?.id)?.trim();
  if (!reviewId) {
    return {
      status: 'error',
      httpStatus: 400,
      error: 'Invalid publishing request: reviewId is required and must be non-empty.'
    };
  }

  // 2. Verified Authentication (Fail-closed)
  // Require Authorization: Bearer <Supabase access token>
  const token = request?.userToken?.trim();
  if (!token) {
    return {
      status: 'error',
      httpStatus: 401,
      error: 'Unauthorized: Missing or invalid authentication token. A valid Supabase Bearer token is required.'
    };
  }

  const authResult = await verifyServerAuth(token, {
    envOverrides: options?.envOverrides,
    supabaseClient: options?.supabaseClient
  });

  if (!authResult.success || !authResult.user) {
    return {
      status: 'error',
      httpStatus: 401,
      error: authResult.error || 'Unauthorized: Token verification failed.'
    };
  }

  const verifiedUser = authResult.user;

  // 3. Trusted Role Authorization
  // Strictly ignore client-supplied X-User-Role, body.userRole, and reviewerName.
  // Resolve role authoritatively from user_roles table or trustedRoleResolver.
  let resolvedRole: UserRole | null = null;

  if (options?.trustedRoleResolver) {
    resolvedRole = await options.trustedRoleResolver(verifiedUser);
  } else {
    // Query authoritative database user_roles table using verified userId
    const roleLookup = await fetchAuthoritativeUserRole(verifiedUser.userId, {
      envOverrides: options?.envOverrides,
      supabaseClient: options?.supabaseClient
    });

    if (!roleLookup.success || !roleLookup.role) {
      return {
        status: 'error',
        httpStatus: roleLookup.statusCode || 403,
        error: roleLookup.error || `Forbidden: No authoritative role assignment found for user "${verifiedUser.userId}".`,
        verifiedUserId: verifiedUser.userId
      };
    }

    resolvedRole = roleLookup.role;
  }

  if (!resolvedRole) {
    return {
      status: 'error',
      httpStatus: 403,
      error: 'Forbidden: No trusted role assignment found for user. A verified server-side role assignment ("Admin" or "Reviewer") is required to publish.',
      verifiedUserId: verifiedUser.userId
    };
  }

  if (!hasPermission(resolvedRole, 'publish_review')) {
    return {
      status: 'error',
      httpStatus: 403,
      error: `Forbidden: User role "${resolvedRole}" is not permitted to publish reviews. Only Admin or Reviewer roles have publishing authorization.`
    };
  }

  // 4. Authoritative Review Lookup
  // Fetch authoritative review state directly from PostgreSQL by reviewId.
  // Client-supplied review title, content, score, and status are completely ignored.
  const reviewLookup = await fetchAuthoritativeReview(reviewId, {
    envOverrides: options?.envOverrides,
    supabaseClient: options?.supabaseClient
  });

  if (!reviewLookup.success || !reviewLookup.review) {
    return {
      status: 'error',
      httpStatus: reviewLookup.statusCode || 500,
      error: reviewLookup.error || `Authoritative review "${reviewId}" could not be retrieved.`
    };
  }

  const authoritativeReview = reviewLookup.review;

  // 5. Authoritative Human Approval Gate & Repeated Publishing Protection
  // Prevent repeated publishing of reviews that are already published
  if (authoritativeReview.status === 'Published') {
    return {
      status: 'error',
      httpStatus: 409,
      error: `Publishing rejected: review "${reviewId}" has already been published. Repeated publishing is prevented to protect downstream systems from duplicate dispatches.`,
      verifiedUserId: verifiedUser.userId
    };
  }

  // Publishing MUST require an explicit human approval in the authoritative database record.
  // Never publish based on an AI compliance score, AI findings, or client-asserted status.
  if (authoritativeReview.status !== 'Approved') {
    return {
      status: 'error',
      httpStatus: 400,
      error: `Publishing rejected: authoritative review status is "${authoritativeReview.status}". Publishing strictly requires explicit human approval ("Approved"). Compliance scores or AI findings alone never authorize publication.`
    };
  }

  // Check explicit human approver identity in database record
  const hasExplicitApprover = Boolean(
    (authoritativeReview.reviewedBy && authoritativeReview.reviewedBy.trim()) ||
    authoritativeReview.decisionHistory?.some((d: any) => d.action === 'Approve')
  );

  if (!hasExplicitApprover) {
    return {
      status: 'error',
      httpStatus: 400,
      error: 'Publishing rejected: authoritative review is marked "Approved" but lacks a verified human approver or approval decision record. An explicit human approver is required.'
    };
  }

  // 6. Server-Side Webhook Configuration Checks
  const envOverrides = options?.envOverrides;
  const isEnabled = (getEnv('PUBLISHING_WEBHOOK_ENABLED', envOverrides) ?? '').toLowerCase() === 'true';
  const configuredWebhookUrl = getEnv('PUBLISHING_WEBHOOK_URL', envOverrides);
  const webhookSecret = getEnv('PUBLISHING_WEBHOOK_SECRET', envOverrides);

  if (!isEnabled || !configuredWebhookUrl || !configuredWebhookUrl.trim()) {
    return {
      status: 'unconfigured',
      httpStatus: 503,
      error: !isEnabled
        ? 'Publishing webhook is disabled. Set PUBLISHING_WEBHOOK_ENABLED=true on the server to enable.'
        : 'Publishing webhook destination is unconfigured. Set PUBLISHING_WEBHOOK_URL on the server to enable.',
      verifiedUserId: verifiedUser.userId
    };
  }

  // 7. SSRF and Destination Override Protection
  // Do not allow client to override the configured webhook URL with an arbitrary URL.
  if (request.destinationUrl && request.destinationUrl.trim()) {
    const normalize = (u: string) => u.trim().replace(/\/+$/, '');
    if (normalize(request.destinationUrl) !== normalize(configuredWebhookUrl)) {
      return {
        status: 'error',
        httpStatus: 400,
        error: 'Destination override forbidden: client-supplied destinationUrl does not match the server-configured webhook destination. Arbitrary webhook destinations are rejected to prevent SSRF vulnerabilities.',
        verifiedUserId: verifiedUser.userId
      };
    }
  }

  // Validate configured destination URL
  const isProduction = options?.isProduction ?? (getEnv('NODE_ENV', envOverrides) === 'production');
  const urlValidation = validateWebhookUrl(configuredWebhookUrl, isProduction);
  if (!urlValidation.valid) {
    return {
      status: 'error',
      httpStatus: 400,
      error: `Invalid webhook destination configuration: ${urlValidation.error}`,
      verifiedUserId: verifiedUser.userId
    };
  }

  // 8. Stable Idempotency Key & Authoritative Payload Construction
  const idempotencyKey = generateStableIdempotencyKey(authoritativeReview);
  const minimalPayload = buildPublishingPayload(authoritativeReview, idempotencyKey);
  const payloadJson = JSON.stringify(minimalPayload);

  // 9. Security Headers & Optional HMAC Signature
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'BrandGuard-AI-Publishing/1.0',
    'X-BrandGuard-Idempotency-Key': idempotencyKey,
    'X-BrandGuard-Review-Id': authoritativeReview.id
  };

  if (webhookSecret && webhookSecret.trim()) {
    headers['X-BrandGuard-Signature'] = `sha256=${createHmacSignature(payloadJson, webhookSecret.trim())}`;
  }

  // 10. Webhook Dispatch with Safe Redirect & Timeout Controls
  const fetchFn = options?.fetchFn || globalThis.fetch;
  const timeoutMs = options?.timeoutMs || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const attemptCount = (authoritativeReview.publishingRecord?.attemptCount || 0) + 1;
  const attemptTimestamp = new Date().toISOString();

  try {
    const response = await fetchFn(configuredWebhookUrl, {
      method: 'POST',
      headers,
      body: payloadJson,
      redirect: 'manual',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // Prevent SSRF via unsafe HTTP redirects
    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
      const sanitizedError = `Webhook returned HTTP redirect ${response.status}. Automatic redirects are disallowed to prevent SSRF vulnerabilities.`;
      const failureRecord: PublishingRecord = {
        idempotencyKey,
        destinationUrl: configuredWebhookUrl,
        destinationName: 'Webhook Integration',
        status: 'failed',
        lastAttemptAt: attemptTimestamp,
        attemptCount,
        statusCode: response.status,
        error: sanitizedError
      };

      await updateAuthoritativePublishingRecord(authoritativeReview.id, failureRecord, {
        envOverrides,
        supabaseClient: options?.supabaseClient
      });

      return {
        status: 'failed',
        httpStatus: 502,
        record: failureRecord,
        error: sanitizedError,
        verifiedUserId: verifiedUser.userId
      };
    }

    if (response.ok) {
      let responseData: unknown = undefined;
      try {
        const text = await response.text();
        if (text && text.trim()) {
          responseData = JSON.parse(text);
        }
      } catch {
        // Non-JSON response body is acceptable if status is 2xx
      }

      const externalReference = extractExternalReference(responseData);
      const successRecord: PublishingRecord = {
        idempotencyKey,
        destinationUrl: configuredWebhookUrl,
        destinationName: 'Webhook Integration',
        status: 'published',
        publishedAt: attemptTimestamp,
        lastAttemptAt: attemptTimestamp,
        attemptCount,
        externalReference,
        statusCode: response.status
      };

      // Authoritatively persist updated status to PostgreSQL
      await updateAuthoritativePublishingRecord(authoritativeReview.id, successRecord, {
        envOverrides,
        supabaseClient: options?.supabaseClient
      });

      return {
        status: 'published',
        httpStatus: 200,
        record: successRecord,
        message: 'Review successfully published via webhook.',
        sanitizedPayload: minimalPayload,
        verifiedUserId: verifiedUser.userId
      };
    }

    // Remote webhook responded with HTTP error (4xx / 5xx)
    const sanitizedError = `Webhook delivery failed with HTTP ${response.status} (${response.statusText || 'Remote Server Error'}).`;
    const failureRecord: PublishingRecord = {
      idempotencyKey,
      destinationUrl: configuredWebhookUrl,
      destinationName: 'Webhook Integration',
      status: 'failed',
      lastAttemptAt: attemptTimestamp,
      attemptCount,
      statusCode: response.status,
      error: sanitizedError
    };

    await updateAuthoritativePublishingRecord(authoritativeReview.id, failureRecord, {
      envOverrides,
      supabaseClient: options?.supabaseClient
    });

    return {
      status: 'failed',
      httpStatus: 502,
      record: failureRecord,
      error: sanitizedError,
      verifiedUserId: verifiedUser.userId
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;
    const sanitizedError = isTimeout
      ? `Publishing webhook request timed out after ${timeoutMs}ms.`
      : `Publishing webhook network error: ${err?.message || 'Connection failed'}`;

    const failureRecord: PublishingRecord = {
      idempotencyKey,
      destinationUrl: configuredWebhookUrl,
      destinationName: 'Webhook Integration',
      status: 'failed',
      lastAttemptAt: attemptTimestamp,
      attemptCount,
      error: sanitizedError
    };

    await updateAuthoritativePublishingRecord(authoritativeReview.id, failureRecord, {
      envOverrides,
      supabaseClient: options?.supabaseClient
    });

    return {
      status: 'failed',
      httpStatus: isTimeout ? 504 : 502,
      record: failureRecord,
      error: sanitizedError,
      verifiedUserId: verifiedUser.userId
    };
  }
}
