import { WebClient } from '@slack/web-api';

// Define our own simple types to avoid complex Slack API type issues
interface SlackBlock {
  type?: string | undefined;
  [key: string]: unknown;
}

interface SlackAttachment {
  [key: string]: unknown;
}

export interface SlackMessage {
  ts: string;
  text?: string | undefined;
  user?: string | undefined;
  thread_ts?: string | undefined;
  blocks?: SlackBlock[] | undefined;
  attachments?: SlackAttachment[] | undefined;
  [key: string]: unknown; // Allow additional properties from Slack API
}

/**
 * Fetch all messages in a Slack thread (parent + replies)
 * @param accessToken - Slack bot access token
 * @param channelId - Slack channel ID
 * @param threadTs - Thread timestamp (parent message timestamp)
 * @returns Promise with array of messages
 */
export async function getThreadMessages({
  accessToken,
  channelId,
  threadTs,
}: {
  accessToken: string;
  channelId: string;
  threadTs: string;
}): Promise<SlackMessage[]> {
  const client = new WebClient(accessToken);

  try {
    const result = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
      inclusive: true, // Include the parent message
    });

    // Cast the result to our SlackMessage type
    const messages = result.messages || [];
    return messages as SlackMessage[];
  } catch (error) {
    console.error('Failed to get thread messages:', error);
    throw error;
  }
}

/**
 * Get a single message from Slack
 * @param accessToken - Slack bot access token
 * @param channelId - Slack channel ID
 * @param messageTs - Message timestamp
 * @returns Promise with the message or null if not found
 */
export async function getMessage({
  accessToken,
  channelId,
  messageTs,
}: {
  accessToken: string;
  channelId: string;
  messageTs: string;
}): Promise<SlackMessage | null> {
  const client = new WebClient(accessToken);

  try {
    const result = await client.conversations.history({
      channel: channelId,
      latest: messageTs,
      limit: 1,
      inclusive: true,
    });

    if (result.messages && result.messages.length > 0) {
      return result.messages[0] as SlackMessage;
    }

    return null;
  } catch (error) {
    console.error('Failed to get message:', error);
    throw error;
  }
}

/**
 * Get thread reply count for a message
 * @param accessToken - Slack bot access token
 * @param channelId - Slack channel ID
 * @param threadTs - Thread timestamp
 * @returns Promise with reply count
 */
export async function getThreadReplyCount({
  accessToken,
  channelId,
  threadTs,
}: {
  accessToken: string;
  channelId: string;
  threadTs: string;
}): Promise<number> {
  const client = new WebClient(accessToken);

  try {
    const result = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
      limit: 1, // We just need the count
    });

    // The first message is the parent, so subtract 1
    const totalMessages = result.messages?.length || 0;
    return totalMessages > 0 ? totalMessages - 1 : 0;
  } catch (error) {
    console.error('Failed to get thread reply count:', error);
    throw error;
  }
}

/**
 * Format Slack messages into a readable string
 * @param messages - Array of Slack messages
 * @returns Formatted string with message content
 */
export function formatThreadMessages(messages: SlackMessage[]): string {
  return messages
    .map((msg, index) => {
      const isParent = index === 0;
      const prefix = isParent ? 'Original message' : `Reply ${index}`;
      const user = msg.user ? `<@${msg.user}>` : 'Unknown user';
      const text = msg.text || '(no text content)';

      return `${prefix} from ${user}:\n${text}`;
    })
    .join('\n\n');
}
