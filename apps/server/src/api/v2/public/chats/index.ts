import { PublicChatError, PublicChatRequestSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createApiKeyAuthMiddleware } from '../../../../middleware/api-key-auth';
import { corsMiddleware } from '../../../../middleware/cors';
import { SSEStreamController, createSSEHeaders } from '../../../../utils/sse';
import { publicChatHandler } from './handler';
import { createErrorEvent } from './helpers/stream-functions';

const app = new Hono();

// Apply CORS middleware to all routes
app.use('*', corsMiddleware);

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

      // Return SSE stream with error event to maintain consistent interface
      const controller = new SSEStreamController();
      const stream = controller.createStream();

      // Send error event
      const errorMessage =
        error instanceof PublicChatError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Internal server error';

      controller.sendEvent(createErrorEvent(errorMessage));
      controller.close();

      return new Response(stream, {
        headers: createSSEHeaders(),
      });
    }
  }
);

export default app;
