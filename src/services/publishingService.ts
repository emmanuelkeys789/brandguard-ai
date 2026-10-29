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
  status: 'published' | 'failed' | 'unconfigured' | 'error';
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000); // 16s timeout

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

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
