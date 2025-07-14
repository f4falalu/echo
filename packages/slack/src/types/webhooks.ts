import { z } from 'zod';

/**
 * URL Verification Challenge
 * Sent by Slack when configuring a Request URL for the Events API
 */
export const urlVerificationSchema = z.object({
  token: z.string(),
  challenge: z.string(),
  type: z.literal('url_verification'),
});

export type UrlVerification = z.infer<typeof urlVerificationSchema>;

/**
 * Slack Request Headers
 * Headers sent with every request from Slack
 */
export const slackRequestHeadersSchema = z.object({
  'x-slack-request-timestamp': z.string(),
  'x-slack-signature': z.string(),
});

export type SlackRequestHeaders = z.infer<typeof slackRequestHeadersSchema>;

/**
 * App Mention Event
 * Sent when a user mentions your app in a message
 */
export const appMentionEventSchema = z.object({
  type: z.literal('app_mention'),
  user: z.string(),
  text: z.string(),
  ts: z.string(),
  channel: z.string(),
  event_ts: z.string(),
});

export type AppMentionEvent = z.infer<typeof appMentionEventSchema>;

/**
 * Event Callback Envelope
 * The wrapper for all event_callback type events
 */
export const eventCallbackSchema = z.object({
  token: z.string(),
  team_id: z.string(),
  api_app_id: z.string(),
  event: appMentionEventSchema,
  type: z.literal('event_callback'),
  event_id: z.string(),
  event_time: z.number(),
});

export type EventCallback = z.infer<typeof eventCallbackSchema>;

/**
 * Base Event Envelope (for backwards compatibility)
 * Uses record for event field to accept any event type
 */
export const slackEventEnvelopeSchema = z.object({
  token: z.string(),
  team_id: z.string(),
  api_app_id: z.string(),
  event: z.record(z.unknown()),
  type: z.literal('event_callback'),
  event_id: z.string(),
  event_time: z.number(),
});

export type SlackEventEnvelope = z.infer<typeof slackEventEnvelopeSchema>;

/**
 * Union type for all possible Slack webhook payloads
 */
export const slackWebhookPayloadSchema = z.union([urlVerificationSchema, eventCallbackSchema]);

export type SlackWebhookPayload = z.infer<typeof slackWebhookPayloadSchema>;

/**
 * Helper function to determine event type
 */
export function isUrlVerification(payload: SlackWebhookPayload): payload is UrlVerification {
  return payload.type === 'url_verification';
}

export function isEventCallback(payload: SlackWebhookPayload): payload is EventCallback {
  return payload.type === 'event_callback';
}
