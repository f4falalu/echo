# Slack API Routes

This directory contains the Slack integration API endpoints.

## Events Endpoint

The `/events` endpoint handles Slack Events API webhooks, including:
- URL verification challenges
- App mention events

### Implementation Details

The endpoint uses a custom `slackWebhookValidator` middleware that:
1. Verifies the request signature using HMAC-SHA256
2. Validates the request timestamp (within 5 minutes)
3. Parses and validates the payload using Zod schemas
4. Handles URL verification challenges automatically

### Using Slack Schemas with zValidator

If you need to validate Slack payloads in other routes, you can use the exported schemas:

```typescript
import { zValidator } from '@hono/zod-validator';
import { appMentionEventSchema, urlVerificationSchema } from '@buster/slack';

// Example: Validate just the inner event
.post('/custom-slack-handler', 
  zValidator('json', appMentionEventSchema), 
  async (c) => {
    const event = c.req.valid('json');
    // event is fully typed as AppMentionEvent
  }
)

// Example: Validate URL verification
.post('/verify', 
  zValidator('json', urlVerificationSchema), 
  async (c) => {
    const { challenge } = c.req.valid('json');
    return c.text(challenge);
  }
)
```

### Available Schemas

From `@buster/slack`:
- `urlVerificationSchema` - URL verification challenge
- `appMentionEventSchema` - App mention event
- `eventCallbackSchema` - Event callback envelope
- `slackWebhookPayloadSchema` - Union of all webhook payloads

### Security Notes

- Always verify webhook signatures before processing
- Respond with 200 OK even for errors to prevent Slack retries
- Keep the signing secret (`SLACK_SIGNING_SECRET`) secure