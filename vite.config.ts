import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ai-tone-api-dev-middleware',
      configureServer(server) {
        server.middlewares.use('/api/ai-tone-review', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
            return;
          }
          let raw = '';
          req.on('data', (chunk) => {
            raw += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(raw || '{}');
              const { handleAiToneReview } = await import('./src/services/aiToneServerHandler.ts');
              const result = await handleAiToneReview(body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ status: 'error', error: err?.message || 'Server error' }));
            }
          });
        });

        server.middlewares.use('/api/multimodal-review', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
            return;
          }
          let raw = '';
          req.on('data', (chunk) => {
            raw += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(raw || '{}');
              const { handleMultimodalReview } = await import('./src/services/multimodalServerHandler.ts');
              const result = await handleMultimodalReview(body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ status: 'error', error: err?.message || 'Server error', visualFindings: [] }));
            }
          });
        });
        server.middlewares.use('/api/publish', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', error: 'Method not allowed. Use POST.' }));
            return;
          }
          let raw = '';
          req.on('data', (chunk) => {
            raw += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(raw || '{}');
              const roleHeader = req.headers['x-user-role'] as any;
              const userIdHeader = req.headers['x-user-id'] as any;
              const authHeader = req.headers['authorization'];

              const { handlePublishReview } = await import('./src/services/publishingHandler.ts');
              const result = await handlePublishReview({
                reviewId: body?.reviewId || body?.review?.id,
                destinationUrl: body?.destinationUrl,
                userToken: typeof authHeader === 'string' ? authHeader : undefined,
                userRole: roleHeader || body?.userRole,
                userId: userIdHeader || body?.userId,
                review: body?.review
              });
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = result.httpStatus;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ status: 'error', error: err?.message || 'Server error processing publishing request' }));
            }
          });
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        }
      }
    }
  }
})

