import { SlackError } from '@buster/server-shared/slack';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { slackWebhookValidator } from '../../../middleware/slack-webhook-validator';
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
  .post('/events', slackWebhookValidator(), async (c) => {
    // Check if this is a URL verification challenge
    const challenge = c.get('slackChallenge');
    if (challenge) {
      return c.text(challenge);
    }

    // Get the validated payload
    const payload = c.get('slackPayload');
    if (!payload) {
      // This shouldn't happen if middleware works correctly
      return c.json({ success: false });
    }

    // Process the event
    const response = await eventsHandler(payload);
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
