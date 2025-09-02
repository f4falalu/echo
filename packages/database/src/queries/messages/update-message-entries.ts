import type { ModelMessage } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { messages } from '../../schema';
import { ReasoningMessageSchema, ResponseMessageSchema } from '../../schemas/message-schemas';
import { fetchMessageEntries } from './helpers/fetch-message-entries';
import {
  mergeRawLlmMessages,
  mergeReasoningMessages,
  mergeResponseMessages,
} from './helpers/merge-entries';
import { messageEntriesCache } from './message-entries-cache';

const UpdateMessageEntriesSchema = z.object({
  messageId: z.string().uuid(),
  rawLlmMessages: z.array(z.custom<ModelMessage>()).optional(),
  responseMessages: z.array(ResponseMessageSchema).optional(),
  reasoningMessages: z.array(ReasoningMessageSchema).optional(),
});

export type UpdateMessageEntriesParams = z.infer<typeof UpdateMessageEntriesSchema>;

/**
 * Updates message entries with cache-first approach for streaming.
 * Cache is the source of truth during streaming, DB is updated for persistence.
 *
 * Merge logic:
 * - responseMessages: upsert by 'id' field, maintaining order
 * - reasoningMessages: upsert by 'id' field, maintaining order
 * - rawLlmMessages: upsert by combination of 'role' and 'toolCallId', maintaining order
 */
export async function updateMessageEntries({
  messageId,
  rawLlmMessages,
  responseMessages,
  reasoningMessages,
}: UpdateMessageEntriesParams): Promise<{ success: boolean }> {
  try {
    // Fetch existing entries from cache or database
    const existingEntries = await fetchMessageEntries(messageId);

    if (!existingEntries) {
      throw new Error(`Message not found: ${messageId}`);
    }

    // Fix any stringified JSON inputs in rawLlmMessages before merging
    const fixedRawLlmMessages = rawLlmMessages?.map((msg) => {
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        const fixedContent = msg.content.map((item) => {
          if (
            typeof item === 'object' &&
            'type' in item &&
            item.type === 'tool-call' &&
            'input' in item &&
            typeof item.input === 'string'
          ) {
            try {
              // Try to parse the stringified JSON
              const parsedInput = JSON.parse(item.input);
              return {
                ...item,
                input: parsedInput,
              };
            } catch {
              // If parsing fails, keep the original
              return item;
            }
          }
          return item;
        });
        return {
          ...msg,
          content: fixedContent,
        };
      }
      return msg;
    });

    // Merge with new entries
    const mergedEntries = {
      responseMessages: responseMessages
        ? mergeResponseMessages(existingEntries.responseMessages, responseMessages)
        : existingEntries.responseMessages,
      reasoning: reasoningMessages
        ? mergeReasoningMessages(existingEntries.reasoning, reasoningMessages)
        : existingEntries.reasoning,
      rawLlmMessages: fixedRawLlmMessages
        ? mergeRawLlmMessages(existingEntries.rawLlmMessages, fixedRawLlmMessages)
        : existingEntries.rawLlmMessages,
    };

    // Update cache immediately (cache is source of truth during streaming)
    messageEntriesCache.set(messageId, mergedEntries);

    // Update database asynchronously for persistence (fire-and-forget)
    // If this fails, cache still has the latest state for next update
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (responseMessages) {
      updateData.responseMessages = mergedEntries.responseMessages;
    }

    if (reasoningMessages) {
      updateData.reasoning = mergedEntries.reasoning;
    }

    if (rawLlmMessages) {
      updateData.rawLlmMessages = mergedEntries.rawLlmMessages;
    }

    // Update database for persistence
    await db
      .update(messages)
      .set(updateData)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update message entries:', error);
    throw new Error(`Failed to update message entries for message ${messageId}`);
  }
}
