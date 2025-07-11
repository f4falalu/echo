import { SlackError } from '@buster/server-shared/slack';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { eventsHandler } from './events';
import { slackHandler } from './handler';

const app = new Hono()
  // Public endpoints (no auth required for OAuth flow)
  .post('/auth/init', requireAuth, (c) => slackHandler.initiateOAuth(c))
  .get('/auth/callback', (c) => slackHandler.handleOAuthCallback(c))
  // Protected endpoints
  .get('/integration', requireAuth, (c) => slackHandler.getIntegration(c))
  .put('/integration', requireAuth, (c) => slackHandler.updateIntegration(c))
  .get('/channels', requireAuth, (c) => slackHandler.getChannels(c))
  .delete('/integration', requireAuth, (c) => slackHandler.removeIntegration(c))
  // Events endpoint (no auth required for Slack webhooks)
  .post('/events', async (c) => {
    const body = await c.req.json();
    const response = await eventsHandler(body);
    return c.json(response);
  })
  // Error handling
  .onError((e, c) => {
    if (e instanceof SlackError) {
      return c.json(e.toResponse(), e.status_code);
    }
    if (e instanceof HTTPException) {
      return e.getResponse();
    }

    console.error('Unhandled error in Slack routes:', e);
    return c.json({ error: 'Internal server error' }, 500);
  });

export default app;
