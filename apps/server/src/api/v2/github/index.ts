import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { requireAuth } from '../../../middleware/auth';
import { githubWebhookValidator } from '../../../middleware/github-webhook-validator';
import '../../../types/hono.types';
import { authCallbackHandler } from './handlers/auth-callback';
import { authInitHandler } from './handlers/auth-init';
import { getIntegrationHandler } from './handlers/get-integration';
import { webhookHandler } from './handlers/webhook';

// Define request schemas
const AuthCallbackSchema = z.object({
  state: z.string().optional(),
  installation_id: z.string().optional(),
  setup_action: z.enum(['install', 'update']).optional(),
  error: z.string().optional(), // GitHub sends this when user cancels
  error_description: z.string().optional(),
});

const app = new Hono()
  // Get integration info - returns non-sensitive data
  .get('/', requireAuth, async (c) => {
    const user = c.get('busterUser');
    const response = await getIntegrationHandler(user);
    return c.json(response);
  })

  // OAuth flow endpoints
  .get('/auth/init', requireAuth, async (c) => {
    const user = c.get('busterUser');
    const response = await authInitHandler(user);
    return c.json(response);
  })

  // OAuth callback - no auth needed since GitHub redirects here
  .get('/auth/callback', zValidator('query', AuthCallbackSchema), async (c) => {
    const query = c.req.valid('query');
    const result = await authCallbackHandler({
      state: query.state,
      installation_id: query.installation_id,
      setup_action: query.setup_action,
      error: query.error,
      error_description: query.error_description,
    });
    return c.redirect(result.redirectUrl);
  })

  // Webhook endpoint - no auth required, verified by signature
  .post('/webhook', githubWebhookValidator(), async (c) => {
    const payload = c.get('githubPayload');

    if (!payload) {
      throw new HTTPException(400, {
        message: 'Invalid webhook payload',
      });
    }

    const response = await webhookHandler(payload);
    return c.json(response, 200);
  })

  // Error handling
  .onError((e, c) => {
    if (e instanceof HTTPException) {
      return e.getResponse();
    }

    console.error('Unhandled error in GitHub routes:', e);
    return c.json({ error: 'Internal server error' }, 500);
  });

export default app;
