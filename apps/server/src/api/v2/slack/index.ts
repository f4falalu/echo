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
    try {
      // Slack sends different content types for different events
      // For URL verification, it's application/x-www-form-urlencoded
      // For actual events, it's application/json
      const contentType = c.req.header('content-type');

      if (contentType?.includes('application/x-www-form-urlencoded')) {
        // Handle URL verification challenge
        const formData = await c.req.parseBody();
        if (formData.challenge) {
          return c.text(formData.challenge as string);
        }
      }

      // For JSON payloads, try to parse but don't fail
      let body = null;
      if (contentType?.includes('application/json')) {
        try {
          body = await c.req.json();
        } catch {
          // If JSON parsing fails, just continue
        }
      }

      const response = await eventsHandler(body);
      return c.json(response);
    } catch (error) {
      // Log the error but always return 200 OK for Slack
      console.error('Error processing Slack event:', error);
      return c.json({ success: true });
    }
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
