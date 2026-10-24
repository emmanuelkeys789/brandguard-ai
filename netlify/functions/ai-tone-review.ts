import { handleAiToneReview, type AiToneReviewRequest } from '../../src/services/aiToneServerHandler.ts';

/**
 * Netlify Function (v2) entrypoint for POST /api/ai-tone-review
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
    const result = await handleAiToneReview(body as AiToneReviewRequest);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: err?.message || 'Server error processing AI tone review'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const config = {
  path: '/api/ai-tone-review'
};
