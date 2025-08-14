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
    const updates: Record<string, SQL | string> = { updatedAt: new Date().toISOString() };

    // Optimized merge for response messages - upsert by 'id'
    if (responseMessages?.length) {
      const newData = JSON.stringify(responseMessages);
      updates.responseMessages = sql`
        COALESCE(
          (SELECT jsonb_agg(value ORDER BY ordinality)
           FROM (
             -- Keep existing messages that aren't being updated
             SELECT value, ordinality
             FROM jsonb_array_elements(COALESCE(${messages.responseMessages}, '[]'::jsonb)) WITH ORDINALITY AS t(value, ordinality)
             WHERE NOT EXISTS (
               SELECT 1 FROM jsonb_array_elements(${newData}::jsonb) AS new_msg
               WHERE new_msg->>'id' = t.value->>'id'
             )
             UNION ALL
             -- Add new/updated messages at the end
             SELECT value, 1000000 + ordinality AS ordinality
             FROM jsonb_array_elements(${newData}::jsonb) WITH ORDINALITY AS t(value, ordinality)
           ) combined),
          '[]'::jsonb
        )`;
    }

    // Optimized merge for reasoning messages - upsert by 'id'
    if (reasoningMessages?.length) {
      const newData = JSON.stringify(reasoningMessages);
      updates.reasoning = sql`
        COALESCE(
          (SELECT jsonb_agg(value ORDER BY ordinality)
           FROM (
             -- Keep existing messages that aren't being updated
             SELECT value, ordinality
             FROM jsonb_array_elements(COALESCE(${messages.reasoning}, '[]'::jsonb)) WITH ORDINALITY AS t(value, ordinality)
             WHERE NOT EXISTS (
               SELECT 1 FROM jsonb_array_elements(${newData}::jsonb) AS new_msg
               WHERE new_msg->>'id' = t.value->>'id'
             )
             UNION ALL
             -- Add new/updated messages at the end
             SELECT value, 1000000 + ordinality AS ordinality
             FROM jsonb_array_elements(${newData}::jsonb) WITH ORDINALITY AS t(value, ordinality)
           ) combined),
          '[]'::jsonb
        )`;
    }

    // Optimized merge for raw LLM messages - upsert by role + toolCallId combination
    if (rawLlmMessages?.length) {
      const newData = JSON.stringify(rawLlmMessages);
      updates.rawLlmMessages = sql`
        COALESCE(
          (SELECT jsonb_agg(value ORDER BY ordinality)
           FROM (
             -- Keep existing messages that aren't being updated
             SELECT value, ordinality
             FROM jsonb_array_elements(COALESCE(${messages.rawLlmMessages}, '[]'::jsonb)) WITH ORDINALITY AS t(value, ordinality)
             WHERE NOT EXISTS (
               SELECT 1 FROM jsonb_array_elements(${newData}::jsonb) AS new_msg
               WHERE new_msg->>'role' = t.value->>'role'
                 AND (
                   -- Compare toolCallIds if they exist
                   (SELECT string_agg(content->>'toolCallId', ',' ORDER BY content->>'toolCallId')
                    FROM jsonb_array_elements(new_msg->'content') content
                    WHERE content->>'toolCallId' IS NOT NULL) =
                   (SELECT string_agg(content->>'toolCallId', ',' ORDER BY content->>'toolCallId')
                    FROM jsonb_array_elements(t.value->'content') content
                    WHERE content->>'toolCallId' IS NOT NULL)
                   OR
                   -- Both have no toolCallIds
                   ((SELECT COUNT(*) FROM jsonb_array_elements(new_msg->'content') content WHERE content->>'toolCallId' IS NOT NULL) = 0
                    AND (SELECT COUNT(*) FROM jsonb_array_elements(t.value->'content') content WHERE content->>'toolCallId' IS NOT NULL) = 0)
                 )
             )
             UNION ALL
             -- Add new/updated messages at the end
             SELECT value, 1000000 + ordinality AS ordinality
             FROM jsonb_array_elements(${newData}::jsonb) WITH ORDINALITY AS t(value, ordinality)
           ) combined),
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
