import type { ReviewItem, PublishingRecord } from '../types/index.ts';
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';

export interface PublishReviewClientOptions {
  reviewId: string;
  review?: ReviewItem;
  destinationUrl?: string;
  token?: string;
  userRole?: string;
  userId?: string;
}

export interface PublishReviewClientResult {
  status: 'published' | 'failed' | 'unconfigured' | 'error' | 'unauthenticated';
  httpStatus: number;
  record?: PublishingRecord;
  message?: string;
  error?: string;
}

let mockPublishHandler: ((options: PublishReviewClientOptions) => Promise<PublishReviewClientResult>) | null = null;

export const publishingService = {
  /**
   * For automated testing: override the server fetch call
   */
  setHandlerForTesting(
    handler: ((options: PublishReviewClientOptions) => Promise<PublishReviewClientResult>) | null
  ): void {
    mockPublishHandler = handler;
  },

  /**
   * Safe check for an active authenticated Supabase session.
   * Returns true only if a valid, non-empty session access token is present.
   */
  async hasActiveSession(): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
      return false;
    }
    try {
      const sessionRes = await supabase.auth.getSession();
      return Boolean(sessionRes?.data?.session?.access_token?.trim());
    } catch {
      return false;
    }
  },

  /**
   * Dispatches an authoritative review publishing request to /api/publish.
   * Handles timeouts, missing tokens, and serverless response formatting safely.
   */
  async requestPublishReview(
    options: PublishReviewClientOptions
  ): Promise<PublishReviewClientResult> {
    if (!options.reviewId || !options.reviewId.trim()) {
      return {
        status: 'error',
        httpStatus: 400,
        error: 'Invalid publishing request: reviewId is required.'
      };
    }

    if (mockPublishHandler) {
      return mockPublishHandler(options);
    }

    // Resolve bearer token from explicit option or live Supabase Auth session
    let bearerToken = options.token?.trim();
    if (!bearerToken && isSupabaseConfigured() && supabase) {
      try {
        const sessionRes = await supabase.auth.getSession();
        const sessionToken = sessionRes?.data?.session?.access_token;
        if (sessionToken) {
          bearerToken = sessionToken.trim();
        }
      } catch {
        // ignore session retrieval error
      }
    }

    // Prevent unauthenticated requests from unnecessarily reaching the publishing endpoint
    if (!bearerToken) {
      return {
        status: 'unauthenticated',
        httpStatus: 401,
        error: 'Authentication Required: Direct webhook publishing requires an active, verified Supabase Auth session. In zero-login evaluation mode, please use the Offline Demo Simulation.'
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000); // 16s timeout

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
      }
      if (options.userRole) {
        headers['x-user-role'] = options.userRole;
      }
      if (options.userId) {
        headers['x-user-id'] = options.userId;
      }

      const response = await fetch('/api/publish', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reviewId: options.reviewId,
          destinationUrl: options.destinationUrl,
          review: options.review
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const httpStatus = response.status;
      let data: any = {};
      try {
        data = await response.json();
      } catch {
        return {
          status: 'error',
          httpStatus,
          error: `Server returned HTTP ${httpStatus} with non-JSON response.`
        };
      }

      return {
        status: data.status || (response.ok ? 'published' : 'error'),
        httpStatus: data.httpStatus || httpStatus,
        record: data.record,
        message: data.message,
        error: data.error
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError';
      return {
        status: 'error',
        httpStatus: isAbort ? 504 : 500,
        error: isAbort
          ? 'Publishing request timed out after 16 seconds. Please check network connectivity.'
          : (err?.message || 'Failed to connect to publishing endpoint.')
      };
    }
  }
};
