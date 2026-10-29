declare const process: { env?: Record<string, string | undefined> } | undefined;

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { PublishingRecord } from '../types/index.ts';
import type { UserRole } from './rbac.ts';

// ============================================================================
// SERVER-ONLY MODULE: serverSupabaseClient.ts
// ============================================================================
// This module manages server-side Supabase authentication and authoritative
// database access. It uses SUPABASE_SERVICE_ROLE_KEY to interact with Supabase
// authoritatively without being subject to public frontend client RLS bypasses.
//
// CRITICAL SECURITY INVARIANTS:
// 1. MUST NEVER be imported by frontend React components or bundled into client code.
// 2. MUST NEVER read or accept VITE-prefixed service-role keys.
// 3. MUST NEVER leak or log SUPABASE_SERVICE_ROLE_KEY in responses or errors.
// ============================================================================

export interface VerifiedServerUser {
  userId: string;
  email?: string;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
}

export interface AuthVerificationResult {
  success: boolean;
  user?: VerifiedServerUser;
  error?: string;
}

export interface AuthoritativeRoleResult {
  success: boolean;
  role?: UserRole;
  error?: string;
  statusCode?: number;
}

export interface AuthoritativeReview {
  id: string;
  brandId?: string;
  title: string;
  channel: string;
  status: string;
  currentDraft: string;
  originalDraft?: string;
  author: string;
  reviewedBy?: string;
  decisionAt?: string;
  reviewerComment?: string;
  confidenceScore: number;
  issuesCount: number;
  wordCount: number;
  rulesCheckedCount?: number;
  decisionHistory?: any[];
  revisions?: any[];
  publishingStatus?: string;
  publishingRecord?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthoritativeReviewResult {
  success: boolean;
  review?: AuthoritativeReview;
  error?: string;
  statusCode?: number;
}

export interface ServerSupabaseOptions {
  envOverrides?: Record<string, string | undefined>;
  supabaseClient?: any;
}

/**
 * Reads server environment variables safely.
 */
function getServerEnv(
  key: string,
  overrides?: Record<string, string | undefined>
): string | undefined {
  if (overrides && key in overrides) {
    return overrides[key];
  }
  if (typeof process !== 'undefined' && process?.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Validates server configuration.
 * Strictly checks that:
 * 1. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY exist in server environment variables.
 * 2. VITE_SUPABASE_SERVICE_ROLE_KEY is NEVER present (prevents client bundle leakage).
 */
export function getServerSupabaseConfig(overrides?: Record<string, string | undefined>): {
  configured: boolean;
  url?: string;
  serviceRoleKey?: string;
  error?: string;
} {
  // Reject accidental or dangerous VITE-prefixed service role keys
  const viteServiceKey = getServerEnv('VITE_SUPABASE_SERVICE_ROLE_KEY', overrides);
  if (viteServiceKey && viteServiceKey.trim()) {
    return {
      configured: false,
      error: 'Security violation: VITE_SUPABASE_SERVICE_ROLE_KEY detected. Service-role keys must NEVER be prefixed with VITE_ or exposed to the client.'
    };
  }

  const url = getServerEnv('SUPABASE_URL', overrides)?.trim();
  const serviceRoleKey = getServerEnv('SUPABASE_SERVICE_ROLE_KEY', overrides)?.trim();

  if (!url || !url.startsWith('http') || !serviceRoleKey) {
    return {
      configured: false,
      error: 'Supabase server configuration is missing. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server environment variables.'
    };
  }

  return {
    configured: true,
    url,
    serviceRoleKey
  };
}

/**
 * Instantiates or returns an authoritative Supabase server client.
 * Allows dependency injection via options.supabaseClient for isolated unit testing.
 */
export function getServerSupabaseClient(options?: ServerSupabaseOptions): {
  client: SupabaseClient | any | null;
  error?: string;
} {
  // Support dependency injection for unit tests
  if (options?.supabaseClient) {
    return { client: options.supabaseClient };
  }

  const config = getServerSupabaseConfig(options?.envOverrides);
  if (!config.configured || !config.url || !config.serviceRoleKey) {
    return { client: null, error: config.error };
  }

  try {
    const client = createClient(config.url, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    return { client };
  } catch (err: any) {
    return {
      client: null,
      error: `Failed to initialize server Supabase client: ${err?.message || 'Initialization error'}`
    };
  }
}

/**
 * Verifies a Supabase Auth access token using the trusted server-side Supabase Auth API (auth.getUser).
 * Strictly validates signature, expiration, and user active status on the server.
 * Does NOT merely decode the JWT or trust client-supplied identity claims.
 */
export async function verifyServerAuth(
  token: string,
  options?: ServerSupabaseOptions
): Promise<AuthVerificationResult> {
  if (!token || typeof token !== 'string') {
    return {
      success: false,
      error: 'Missing authentication token. Bearer token is required.'
    };
  }

  // Strip optional 'Bearer ' prefix
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) {
    return {
      success: false,
      error: 'Empty authentication token provided.'
    };
  }

  // Basic JWT structural sanity check (3 dot-separated base64 segments)
  const segments = cleanToken.split('.');
  if (segments.length !== 3 || segments.some((s) => s.length === 0)) {
    return {
      success: false,
      error: 'Malformed authentication token: JWT must contain exactly 3 segments separated by dots.'
    };
  }

  const { client, error: clientError } = getServerSupabaseClient(options);
  if (!client) {
    return {
      success: false,
      error: clientError || 'Supabase server configuration is missing.'
    };
  }

  try {
    // Cryptographically validates the token against Supabase Auth service
    const { data, error } = await client.auth.getUser(cleanToken);

    if (error || !data?.user) {
      return {
        success: false,
        error: `Authentication token validation failed: ${error?.message || 'Invalid or expired token.'}`
      };
    }

    const user = data.user;
    return {
      success: true,
      user: {
        userId: user.id,
        email: user.email || undefined,
        appMetadata: user.app_metadata || undefined,
        userMetadata: user.user_metadata || undefined
      }
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Server auth verification error: ${err?.message || 'Verification failed'}`
    };
  }
}

/**
 * Queries the public.user_roles table using the verified Supabase Auth user ID.
 * Resolves the authoritative role strictly from the PostgreSQL database using service_role credentials.
 * If the role table is missing, the role is absent, or the query fails, it fails closed with a sanitized error.
 * Never assigns privileged roles automatically or falls back to client-supplied roles.
 */
export async function fetchAuthoritativeUserRole(
  userId: string,
  options?: ServerSupabaseOptions
): Promise<AuthoritativeRoleResult> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return {
      success: false,
      statusCode: 400,
      error: 'Invalid userId for role resolution.'
    };
  }

  const { client, error: clientError } = getServerSupabaseClient(options);
  if (!client) {
    return {
      success: false,
      statusCode: 503,
      error: clientError || 'Supabase server configuration is missing. Cannot resolve user role.'
    };
  }

  try {
    const { data: row, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId.trim())
      .maybeSingle();

    if (error) {
      return {
        success: false,
        statusCode: 500,
        error: `Database error querying user role for "${userId}": ${error.message}`
      };
    }

    if (!row || !row.role) {
      return {
        success: false,
        statusCode: 403,
        error: `No role assigned for user "${userId}". An authoritative role assignment ("Admin", "Reviewer", or "Editor") in user_roles is required.`
      };
    }

    const role = row.role;
    if (role !== 'Admin' && role !== 'Reviewer' && role !== 'Editor') {
      return {
        success: false,
        statusCode: 403,
        error: `Invalid role "${role}" in database for user "${userId}".`
      };
    }

    return {
      success: true,
      role: role as UserRole
    };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 500,
      error: `Server role lookup error: ${err?.message || 'Connection failure'}`
    };
  }
}


/**
 * Fetches an authoritative review directly from the PostgreSQL brand_reviews table by ID.
 * Returns only verified columns defined in supabase/schema.sql.
 * Never falls back to client-supplied review content or unverified state.
 */
export async function fetchAuthoritativeReview(
  reviewId: string,
  options?: ServerSupabaseOptions
): Promise<AuthoritativeReviewResult> {
  if (!reviewId || typeof reviewId !== 'string' || !reviewId.trim()) {
    return {
      success: false,
      statusCode: 400,
      error: 'Invalid review lookup request: reviewId is required and must be non-empty.'
    };
  }

  const { client, error: clientError } = getServerSupabaseClient(options);
  if (!client) {
    return {
      success: false,
      statusCode: 503,
      error: clientError || 'Supabase server configuration is missing. Cannot fetch authoritative review state.'
    };
  }

  try {
    const { data: row, error } = await client
      .from('brand_reviews')
      .select('*')
      .eq('id', reviewId.trim())
      .maybeSingle();

    if (error) {
      return {
        success: false,
        statusCode: 500,
        error: `Database query error for review "${reviewId}": ${error.message}`
      };
    }

    if (!row) {
      return {
        success: false,
        statusCode: 404,
        error: `Review with ID "${reviewId}" was not found in the authoritative database.`
      };
    }

    // Map strictly from columns defined in supabase/schema.sql (supporting DB rows and test objects)
    const review: AuthoritativeReview = {
      id: row.id,
      brandId: row.brand_id || row.brandId || undefined,
      title: row.title,
      channel: row.channel,
      status: row.status,
      currentDraft: row.current_draft ?? row.currentDraft ?? '',
      originalDraft: row.original_draft || row.originalDraft || undefined,
      author: row.author,
      reviewedBy: row.reviewed_by || row.reviewedBy || undefined,
      decisionAt: row.decision_at || row.decisionAt || undefined,
      reviewerComment: row.reviewer_comment || row.reviewerComment || undefined,
      confidenceScore: Number(row.confidence_score ?? row.confidenceScore ?? 100),
      issuesCount: Number(row.issues_count ?? row.issuesCount ?? 0),
      wordCount: Number(row.word_count ?? row.wordCount ?? 0),
      rulesCheckedCount: typeof row.rules_checked_count === 'number'
        ? row.rules_checked_count
        : (typeof row.rulesCheckedCount === 'number' ? row.rulesCheckedCount : undefined),
      decisionHistory: Array.isArray(row.decision_history)
        ? row.decision_history
        : (Array.isArray(row.decisionHistory) ? row.decisionHistory : []),
      revisions: Array.isArray(row.revisions)
        ? row.revisions
        : (Array.isArray(row.revisions) ? row.revisions : []),
      publishingStatus: row.publishing_status || row.publishingStatus || undefined,
      publishingRecord: row.publishing_record || row.publishingRecord || undefined,
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt
    };

    return {
      success: true,
      review
    };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 500,
      error: `Server database fetch error: ${err?.message || 'Connection failure'}`
    };
  }
}

/**
 * Authoritatively updates publishing metadata for a review in the PostgreSQL database.
 * Only transitions status to 'Published' if the publishing webhook confirmed delivery success.
 */
export async function updateAuthoritativePublishingRecord(
  reviewId: string,
  record: PublishingRecord,
  options?: ServerSupabaseOptions
): Promise<{ success: boolean; error?: string }> {
  if (!reviewId || typeof reviewId !== 'string' || !reviewId.trim()) {
    return { success: false, error: 'Invalid reviewId for publishing update.' };
  }

  const { client, error: clientError } = getServerSupabaseClient(options);
  if (!client) {
    return {
      success: false,
      error: clientError || 'Supabase server configuration is missing.'
    };
  }

  try {
    const updatePayload: Record<string, any> = {
      publishing_status: record.status,
      publishing_record: record,
      updated_at: new Date().toISOString()
    };

    if (record.status === 'published') {
      updatePayload.status = 'Published';
    }

    const { error } = await client
      .from('brand_reviews')
      .update(updatePayload)
      .eq('id', reviewId.trim());

    if (error) {
      return {
        success: false,
        error: `Database update error for review "${reviewId}": ${error.message}`
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: `Server database update error: ${err?.message || 'Connection failure'}`
    };
  }
}

