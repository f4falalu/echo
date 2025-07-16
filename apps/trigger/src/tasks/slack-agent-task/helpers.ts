import {
  chats,
  db,
  getSecretByName,
  messages,
  slackIntegrations,
  updateMessage,
} from '@buster/database';
import type { Chat, Message } from '@buster/database';
import { tasks } from '@trigger.dev/sdk';
import { and, eq, isNull } from 'drizzle-orm';
import type { analystAgentTask } from '../analyst-agent-task/analyst-agent-task';

/**
 * Create a message for an existing chat
 * This replicates the logic from the server's createMessage function
 * but is self-contained for the trigger app
 */
export async function createMessageForChat({
  chatId,
  userId,
  content,
}: {
  chatId: string;
  userId: string;
  content: string;
}): Promise<Message> {
  const messageId = crypto.randomUUID();

  // Use transaction to ensure atomicity
  const result = await db.transaction(async (tx) => {
    const [message] = await tx
      .insert(messages)
      .values({
        id: messageId,
        chatId: chatId,
        createdBy: userId,
        requestMessage: content,
        responseMessages: {},
        reasoning: {},
        title: content.substring(0, 255), // Ensure title fits in database
        rawLlmMessages: {},
        isCompleted: false,
      })
      .returning();

    if (!message) {
      throw new Error('Failed to create message');
    }

    // Update chat's updated_at timestamp
    await tx.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, chatId));

    return message;
  });

  return result;
}

/**
 * Trigger the analyst agent task for a message
 * Returns the trigger handle ID for tracking
 */
export async function triggerAnalystAgent(messageId: string): Promise<string> {
  try {
    // Trigger the analyst agent task
    const taskHandle = await tasks.trigger<typeof analystAgentTask>('analyst-agent-task', {
      message_id: messageId,
    });

    // Verify trigger service received the task
    if (!taskHandle.id) {
      throw new Error('Trigger service returned invalid handle');
    }

    // Update the message with the trigger run ID
    await updateMessage(messageId, {
      triggerRunId: taskHandle.id,
    });

    return taskHandle.id;
  } catch (error) {
    console.error('Failed to trigger analyst agent task:', error);
    throw error;
  }
}

/**
 * Main helper to create a message and trigger analysis
 * Combines both operations for convenience
 */
export async function createMessageAndTriggerAnalysis({
  chatId,
  userId,
  content,
}: {
  chatId: string;
  userId: string;
  content: string;
}): Promise<{
  message: Message;
  triggerRunId: string;
}> {
  // Create the message
  const message = await createMessageForChat({
    chatId,
    userId,
    content,
  });

  // Trigger the analyst agent task
  const triggerRunId = await triggerAnalystAgent(message.id);

  return {
    message,
    triggerRunId,
  };
}

/**
 * Fetch chat details including Slack integration information
 */
export async function getChatDetails(chatId: string): Promise<{
  chat: Chat;
  organizationId: string;
  slackThreadTs: string | null;
  slackChannelId: string | null;
}> {
  const [chatRecord] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)))
    .limit(1);

  if (!chatRecord) {
    throw new Error(`Chat not found: ${chatId}`);
  }

  return {
    chat: chatRecord,
    organizationId: chatRecord.organizationId,
    slackThreadTs: chatRecord.slackThreadTs,
    slackChannelId: chatRecord.slackChannelId,
  };
}

/**
 * Get Slack integration and secrets for an organization
 */
export async function getOrganizationSlackIntegration(organizationId: string): Promise<{
  integration: typeof slackIntegrations.$inferSelect;
  accessToken: string;
}> {
  // Get the active Slack integration for the organization
  const [integration] = await db
    .select()
    .from(slackIntegrations)
    .where(
      and(
        eq(slackIntegrations.organizationId, organizationId),
        isNull(slackIntegrations.deletedAt),
        eq(slackIntegrations.status, 'active')
      )
    )
    .limit(1);

  if (!integration) {
    throw new Error(`No active Slack integration found for organization: ${organizationId}`);
  }

  // Get the access token from vault using the tokenVaultKey
  if (!integration.tokenVaultKey) {
    throw new Error(`No token vault key found for integration: ${integration.id}`);
  }

  const vaultSecret = await getSecretByName(integration.tokenVaultKey);

  if (!vaultSecret) {
    throw new Error(`No token found in vault for key: ${integration.tokenVaultKey}`);
  }

  return {
    integration,
    accessToken: vaultSecret.secret,
  };
}
