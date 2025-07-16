import type { SlackEventsResponse } from '@buster/server-shared/slack';
import { type SlackWebhookPayload, isEventCallback } from '@buster/slack';

/**
 * Handles Slack Events API webhook requests
 * Processes validated webhook payloads
 */
export async function eventsHandler(payload: SlackWebhookPayload): Promise<SlackEventsResponse> {
  try {
    // Handle the event based on type
    if (isEventCallback(payload)) {
      // Handle app_mention event
      const event = payload.event;

      console.info('App mentioned:', {
        team_id: payload.team_id,
        channel: event.channel,
        user: event.user,
        text: event.text,
        event_id: payload.event_id,
      });

      // TODO: Process app mention and respond
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to process Slack event:', error);
    throw error;
  }
}
