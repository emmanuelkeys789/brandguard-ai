import {
  handleMultimodalReview,
  type MultimodalReviewRequest
} from '../../src/services/multimodalServerHandler.ts';

/**
 * Netlify Function (v2) entrypoint for POST /api/multimodal-review
 */
export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const result = await handleMultimodalReview(body as MultimodalReviewRequest);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: err?.message || 'Server error processing multimodal review',
        visualFindings: []
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const config = {
  path: '/api/multimodal-review'
};
