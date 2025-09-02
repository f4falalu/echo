import { PublicChatRequestSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createApiKeyAuthMiddleware } from '../../../../middleware/api-key-auth';
import { createSSEHeaders } from '../../../../utils/sse';
import { publicChatHandler } from './handler';

const app = new Hono();

/**
 * POST /api/v2/public/chats
 *
 * Creates a new chat session with SSE streaming response
 * Requires API key authentication via Bearer token
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "prompt": "Your question here"
 * }
 *
 * Response: Server-Sent Events stream
 */
app.post(
  '/',
  createApiKeyAuthMiddleware(),
  zValidator('json', PublicChatRequestSchema),
  async (c) => {
    try {
      // Get the validated API key context
      const apiKey = c.get('apiKey');
      if (!apiKey) {
        return c.json(
          {
            error: 'Authentication required',
            code: 'INVALID_API_KEY',
          },
          401
        );
      }

      // Get the validated request body
      const request = c.req.valid('json');

      // Process the chat request and get the SSE stream
      const stream = await publicChatHandler(request, apiKey);

      // Return the SSE response with proper headers
      return new Response(stream, {
        headers: createSSEHeaders(),
      });
    } catch (error) {
      // Handle errors that occur during handler execution
      console.error('Public chat endpoint error:', error);

      // For SSE endpoints, we should still return a stream with an error event
      // But for now, return a JSON error for simplicity
      return c.json(
        {
          error: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        500
      );
    }
  }
);

/**
 * OPTIONS /api/v2/public/chats
 *
 * CORS preflight handler
 */
app.options('/', (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400');
  return c.body(null, 204);
});

export default app;
