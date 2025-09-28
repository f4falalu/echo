import { and, eq, getDb, isNotNull, isNull, lte } from '@buster/database/connection';
import { messages } from '@buster/database/schema';
import { DataFetchError, type PostProcessingResult } from '../types';

/**
 * Fetch previous post-processing results
 */
export async function fetchPreviousPostProcessingMessages(
  chatId: string,
  beforeTimestamp: Date
): Promise<PostProcessingResult[]> {
  const db = getDb();

  try {
    const result = await db
      .select({
        postProcessingMessage: messages.postProcessingMessage,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          isNotNull(messages.postProcessingMessage),
          isNull(messages.deletedAt),
          lte(messages.createdAt, beforeTimestamp.toISOString())
        )
      )
      .orderBy(messages.createdAt);

    return result.map((msg) => ({
      postProcessingMessage: msg.postProcessingMessage as Record<string, unknown>,
      createdAt: new Date(msg.createdAt),
    }));
  } catch (error) {
    throw new DataFetchError(
      `Failed to fetch previous post-processing messages for chat ${chatId}`,
      error instanceof Error ? { cause: error } : undefined
    );
  }
}
