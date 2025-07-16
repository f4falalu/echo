import {
  chats,
  db,
  getSecretByName,
  messages,
  slackIntegrations,
  updateMessage,
} from '@buster/database';
import type { Chat, Message } from '@buster/database';
import { and, eq, isNull } from 'drizzle-orm';

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
 * Main helper to create a message
 * Now only creates the message, triggering is handled in the main task
 */
export async function createMessage({
  chatId,
  userId,
  content,
}: {
  chatId: string;
  userId: string;
  content: string;
}): Promise<Message> {
  // Create the message
  const message = await createMessageForChat({
    chatId,
    userId,
    content,
  });

  return message;
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

/**
 * Filter Slack messages to only include non-bot messages after the most recent app mention
 *
 * @param messages - Array of Slack messages from a thread
 * @param botUserId - The bot user ID to identify bot messages
 * @returns Object containing array of non-bot messages that came after the most recent @mention and the mention message timestamp
 */
export function filterMessagesAfterLastMention(
  messages: Array<{
    ts: string;
    text?: string | undefined;
    user?: string | undefined;
    [key: string]: unknown;
  }>,
  botUserId: string
): {
  filteredMessages: Array<{
    ts: string;
    text?: string | undefined;
    user?: string | undefined;
    [key: string]: unknown;
  }>;
  mentionMessageTs: string | null;
} {
  if (!messages || messages.length === 0) {
    return { filteredMessages: [], mentionMessageTs: null };
  }

  // Find the most recent message that contains an app mention (@Buster)
  let lastMentionIndex = -1;
  let mentionMessageTs: string | null = null;

  // Iterate backwards to find the most recent mention
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.text?.includes(`<@${botUserId}>`)) {
      lastMentionIndex = i;
      mentionMessageTs = message.ts;
      break;
    }
  }

  // If no mention found, return empty array
  if (lastMentionIndex === -1) {
    return { filteredMessages: [], mentionMessageTs: null };
  }

  // Filter messages: only non-bot messages after the last mention
  const filteredMessages = messages
    .slice(lastMentionIndex + 1) // Get messages after the mention
    .filter((message) => message.user !== botUserId); // Remove bot messages

  return { filteredMessages, mentionMessageTs };
}
