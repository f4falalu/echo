import { WebClient } from '@slack/web-api';

/**
 * Type guard to check if a message has reactions
 */
function hasReactions(
  message: unknown
): message is { reactions?: Array<{ name?: string; users?: string[]; count?: number }> } {
  return typeof message === 'object' && message !== null && 'reactions' in message;
}

/**
 * Add an emoji reaction to a Slack message
 * @param accessToken - Slack bot access token
 * @param channelId - Slack channel ID
 * @param messageTs - Message timestamp
 * @param emoji - Emoji name (without colons)
 * @returns Promise that resolves when reaction is added
 */
export async function addReaction({
  accessToken,
  channelId,
  messageTs,
  emoji,
}: {
  accessToken: string;
  channelId: string;
  messageTs: string;
  emoji: string;
}): Promise<void> {
  const client = new WebClient(accessToken);

  try {
    await client.reactions.add({
      channel: channelId,
      timestamp: messageTs,
      name: emoji,
    });
  } catch (error) {
    // If the reaction already exists, that's fine
    if (error instanceof Error && error.message.includes('already_reacted')) {
      console.info(`Reaction ${emoji} already exists on message`);
      return;
    }
    throw error;
  }
}

/**
 * Remove an emoji reaction from a Slack message
 * @param accessToken - Slack bot access token
 * @param channelId - Slack channel ID
 * @param messageTs - Message timestamp
 * @param emoji - Emoji name (without colons)
 * @returns Promise that resolves when reaction is removed
 */
export async function removeReaction({
  accessToken,
  channelId,
  messageTs,
  emoji,
}: {
  accessToken: string;
  channelId: string;
  messageTs: string;
  emoji: string;
}): Promise<void> {
  const client = new WebClient(accessToken);

  try {
    await client.reactions.remove({
      channel: channelId,
      timestamp: messageTs,
      name: emoji,
    });
  } catch (error) {
    // If the reaction doesn't exist, that's fine
    if (error instanceof Error && error.message.includes('no_reaction')) {
      console.info(`Reaction ${emoji} doesn't exist on message`);
      return;
    }
    throw error;
  }
}

/**
 * Get reactions for a message
 * @param accessToken - Slack bot access token
 * @param channelId - Slack channel ID
 * @param messageTs - Message timestamp
 * @returns Promise with array of reactions
 */
export async function getReactions({
  accessToken,
  channelId,
  messageTs,
}: {
  accessToken: string;
  channelId: string;
  messageTs: string;
}): Promise<
  Array<{
    name: string;
    users: string[];
    count: number;
  }>
> {
  const client = new WebClient(accessToken);

  try {
    const result = await client.reactions.get({
      channel: channelId,
      timestamp: messageTs,
    });

    if (result.type === 'message' && result.message && hasReactions(result.message)) {
      // Map Slack API reactions to our expected format
      const reactions = result.message.reactions || [];
      return reactions.map((reaction) => ({
        name: reaction.name || '',
        users: reaction.users || [],
        count: reaction.count || 0,
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to get reactions:', error);
    throw error;
  }
}
