import { chats, db } from '@buster/database';
import type { SlackEventsResponse } from '@buster/server-shared/slack';
import { type SlackWebhookPayload, isEventCallback } from '@buster/slack';
import { tasks } from '@trigger.dev/sdk';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';
import {
  type SlackAuthenticationResult,
  authenticateSlackUser,
  getUserIdFromAuthResult,
} from './services/slack-authentication';

/**
 * Map authentication result type to database enum value
 */
function mapAuthResultToDbEnum(
  authType: SlackAuthenticationResult['type']
): 'unauthorized' | 'authorized' | 'auto_added' {
  switch (authType) {
    case 'unauthorized':
      return 'unauthorized';
    case 'authorized':
      return 'authorized';
    case 'auto_added':
      return 'auto_added';
    default:
      return 'unauthorized';
  }
}

/**
 * Find or create a chat for a Slack thread
 */
export async function findOrCreateSlackChat({
  threadTs,
  channelId,
  organizationId,
  userId,
  slackChatAuthorization,
}: {
  threadTs: string;
  channelId: string;
  organizationId: string;
  userId: string;
  slackChatAuthorization: 'unauthorized' | 'authorized' | 'auto_added';
}): Promise<string> {
  // Find existing chat
  const existingChat = await db
    .select()
    .from(chats)
    .where(
      and(
        eq(chats.slackThreadTs, threadTs),
        eq(chats.slackChannelId, channelId),
        eq(chats.organizationId, organizationId),
        eq(chats.createdBy, userId)
      )
    )
    .limit(1);

  if (existingChat.length > 0) {
    const chat = existingChat[0];
    if (!chat) {
      throw new Error('Chat data is missing');
    }
    return chat.id;
  }

  // Create new chat
  const newChat = await db
    .insert(chats)
    .values({
      title: '',
      organizationId,
      createdBy: userId,
      updatedBy: userId,
      slackChatAuthorization,
      slackThreadTs: threadTs,
      slackChannelId: channelId,
    })
    .returning();

  const chat = newChat[0];
  if (!chat) {
    throw new Error('Failed to create chat');
  }
  return chat.id;
}

/**
 * Queue slack agent task for processing
 */
export async function queueSlackAgentTask(chatId: string, userId: string): Promise<void> {
  await tasks.trigger('slack-agent-task', {
    chatId,
    userId,
  });
}

/**
 * Handles the /events endpoint for Slack Events API
 * Includes URL verification and event processing
 */
export async function handleSlackEventsEndpoint(c: Context) {
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
}

/**
 * Handles Slack Events API webhook requests
 * Processes validated webhook payloads
 */
export async function eventsHandler(payload: SlackWebhookPayload): Promise<SlackEventsResponse> {
  try {
    // Handle the event based on type
    if (isEventCallback(payload) && payload.event.type === 'app_mention') {
      // Handle app_mention event
      const event = payload.event;

      console.info('App mentioned:', {
        team_id: payload.team_id,
        channel: event.channel,
        user: event.user,
        text: event.text,
        event_id: payload.event_id,
      });

      // Authenticate the Slack user
      const authResult = await authenticateSlackUser(event.user, payload.team_id);

      // Check if authentication was successful
      const userId = getUserIdFromAuthResult(authResult);
      if (!userId) {
        console.warn('Slack user authentication failed:', {
          slackUserId: event.user,
          teamId: payload.team_id,
          reason: authResult.type === 'unauthorized' ? authResult.reason : 'Unknown',
        });
        // Return success to prevent Slack retries
        return { success: true };
      }

      const organizationId = authResult.type === 'unauthorized' ? '' : authResult.organization.id;

      // Extract thread timestamp - if no thread_ts, this is a new thread so use ts
      const threadTs = event.thread_ts || event.ts;

      // Find or create chat
      const chatId = await findOrCreateSlackChat({
        threadTs,
        channelId: event.channel,
        organizationId,
        userId,
        slackChatAuthorization: mapAuthResultToDbEnum(authResult.type),
      });

      // Queue the task
      await queueSlackAgentTask(chatId, userId);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to process Slack event:', error);
    throw error;
  }
}
