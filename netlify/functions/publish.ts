import {
  handlePublishReview,
  type PublishingServerRequest
} from '../../src/services/publishingHandler.ts';
import type { UserRole } from '../../src/services/rbac.ts';

/**
 * Netlify Function (v2) entrypoint for POST /api/publish
 */
export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: 'Method not allowed. Use POST.'
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: 'Invalid JSON request body.'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const authHeader = req.headers.get('authorization');
  const roleHeader = req.headers.get('x-user-role') as UserRole | null;
  const userIdHeader = req.headers.get('x-user-id');

  const publishReq: PublishingServerRequest = {
    reviewId: body?.reviewId || body?.review?.id,
    userToken: authHeader || undefined,
    destinationUrl: body?.destinationUrl,
    userRole: roleHeader || body?.userRole,
    userId: userIdHeader || body?.userId,
    review: body?.review
  };

  try {
    const result = await handlePublishReview(publishReq);
    return new Response(JSON.stringify(result), {
      status: result.httpStatus,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: err?.message || 'Server error processing publishing request'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const config = {
  path: '/api/publish'
};
