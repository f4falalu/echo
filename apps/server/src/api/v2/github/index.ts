import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { githubWebhookValidator } from '../../../middleware/github-webhook-validator';
import '../../../types/hono.types';
import { getInstallationTokenHandler } from './handlers/get-installation-token';
import { installationCallbackHandler } from './handlers/installation-callback';
import { refreshInstallationTokenHandler } from './handlers/refresh-installation-token';

const app = new Hono()
  // Webhook endpoint - no auth required, verified by signature
  .post('/installation/callback', githubWebhookValidator(), async (c) => {
    const payload = c.get('githubPayload');

    if (!payload) {
      throw new HTTPException(400, {
        message: 'Invalid webhook payload',
      });
    }

    // For webhooks, we don't have user context
    // In production, you might extract org/user from:
    // 1. A state parameter in the installation URL
    // 2. A mapping table of GitHub org ID to your org ID
    // 3. Require a separate OAuth flow to claim the installation

    // For now, we'll handle the webhook without user context for non-created actions
    const response = await installationCallbackHandler(payload);

    return c.json(response, 200);
  })

  // Protected endpoints - require authentication
  .get('/installations/:installationId/token', requireAuth, async (c) => {
    const user = c.get('busterUser');
    const { installationId } = c.req.param();

    const response = await getInstallationTokenHandler(installationId, user);
    return c.json(response);
  })

  .get('/installations/refresh', requireAuth, async (c) => {
    const user = c.get('busterUser');

    const response = await refreshInstallationTokenHandler(user);
    return c.json(response);
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
