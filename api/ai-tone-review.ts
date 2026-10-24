import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAiToneReview, type AiToneReviewRequest } from '../src/services/aiToneServerHandler.ts';

/**
 * Vercel Serverless Function entry point for POST /api/ai-tone-review
 */
export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse & { status?: any; json?: any }) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
    return;
  }

  let body: any = req.body;

  if (!body) {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
    }
    try {
      body = JSON.parse(raw || '{}');
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON request body.' }));
      return;
    }
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON request body string.' }));
      return;
    }
  }

  try {
    const result = await handleAiToneReview(body as AiToneReviewRequest);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', error: err?.message || 'Server error processing AI review' }));
  }
}
