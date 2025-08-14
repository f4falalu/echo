import type { ModelMessage } from 'ai';
import { type SQL, and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { messages } from '../../schema';
import { ReasoningMessageSchema, ResponseMessageSchema } from '../../schemas/message-schemas';

const UpdateMessageEntriesSchema = z.object({
  messageId: z.string().uuid(),
  rawLlmMessages: z.array(z.custom<ModelMessage>()).optional(),
  responseMessages: z.array(ResponseMessageSchema).optional(),
  reasoningMessages: z.array(ReasoningMessageSchema).optional(),
});

export type UpdateMessageEntriesParams = z.infer<typeof UpdateMessageEntriesSchema>;

/**
 * Updates message entries using optimized JSONB merge operations.
 * Performs batch upserts for multiple entries in a single database operation.
 *
 * Upsert logic:
 * - responseMessages: upsert by 'id' field
 * - reasoningMessages: upsert by 'id' field
 * - rawLlmMessages: upsert by combination of 'role' and 'toolCallId' in content array
 */
export async function updateMessageEntries({
  messageId,
  rawLlmMessages,
  responseMessages,
  reasoningMessages,
}: UpdateMessageEntriesParams): Promise<{ success: boolean }> {
  try {
    const updates: Record<string, SQL | Date> = { updatedAt: new Date() };

    // Optimized merge for response messages - upsert by 'id'
    if (responseMessages?.length) {
      const newData = JSON.stringify(responseMessages);
      updates.responseMessages = sql`
        COALESCE(
          (SELECT jsonb_agg(value)
           FROM (
             SELECT DISTINCT ON (value->>'id') value
             FROM (
               SELECT jsonb_array_elements(COALESCE(${messages.responseMessages}, '[]'::jsonb))
               UNION ALL
               SELECT jsonb_array_elements(${newData}::jsonb)
             ) combined(value)
             ORDER BY value->>'id', value DESC
           ) deduplicated),
          '[]'::jsonb
        )`;
    }

    // Optimized merge for reasoning messages - upsert by 'id'
    if (reasoningMessages?.length) {
      const newData = JSON.stringify(reasoningMessages);
      updates.reasoning = sql`
        COALESCE(
          (SELECT jsonb_agg(value)
           FROM (
             SELECT DISTINCT ON (value->>'id') value
             FROM (
               SELECT jsonb_array_elements(COALESCE(${messages.reasoning}, '[]'::jsonb))
               UNION ALL
               SELECT jsonb_array_elements(${newData}::jsonb)
             ) combined(value)
             ORDER BY value->>'id', value DESC
           ) deduplicated),
          '[]'::jsonb
        )`;
    }

    // Optimized merge for raw LLM messages - upsert by role + toolCallId combination
    if (rawLlmMessages?.length) {
      const newData = JSON.stringify(rawLlmMessages);
      updates.rawLlmMessages = sql`
        COALESCE(
          (SELECT jsonb_agg(value)
           FROM (
             SELECT DISTINCT ON (
               value->>'role',
               (SELECT string_agg(content->>'toolCallId', ',' ORDER BY content->>'toolCallId')
                FROM jsonb_array_elements(value->'content') content
                WHERE content->>'toolCallId' IS NOT NULL)
             ) value
             FROM (
               SELECT jsonb_array_elements(COALESCE(${messages.rawLlmMessages}, '[]'::jsonb))
               UNION ALL
               SELECT jsonb_array_elements(${newData}::jsonb)
             ) combined(value)
             ORDER BY 
               value->>'role',
               (SELECT string_agg(content->>'toolCallId', ',' ORDER BY content->>'toolCallId')
                FROM jsonb_array_elements(value->'content') content
                WHERE content->>'toolCallId' IS NOT NULL),
               value DESC
           ) deduplicated),
          '[]'::jsonb
        )`;
    }

    await db
      .update(messages)
      .set(updates)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update message entries:', error);
    throw new Error(`Failed to update message entries for message ${messageId}`);
  }
}
