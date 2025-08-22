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
 * Updates message entries using order-preserving JSONB merge operations.
 * Performs batch upserts for multiple entries in a single database operation.
 * PRESERVES the exact order of input arrays during upsert/append operations.
 *
 * Upsert logic:
 * - responseMessages: upsert by 'id' field, maintaining input array order
 * - reasoningMessages: upsert by 'id' field, maintaining input array order
 * - rawLlmMessages: upsert by combination of 'role' and 'toolCallId', maintaining input array order
 *   (handles both string content and array content with tool calls)
 */
export async function updateMessageEntries({
  messageId,
  rawLlmMessages,
  responseMessages,
  reasoningMessages,
}: UpdateMessageEntriesParams): Promise<{ success: boolean }> {
  try {
    const updates: Record<string, SQL | string> = { updatedAt: new Date().toISOString() };

    // Order-preserving merge for response messages
    if (responseMessages?.length) {
      const newData = JSON.stringify(responseMessages);
      updates.responseMessages = sql`
        CASE 
          WHEN ${messages.responseMessages} IS NULL THEN ${newData}::jsonb
          ELSE (
            WITH new_data AS (
              SELECT value, ordinality as new_order
              FROM jsonb_array_elements(${newData}::jsonb) WITH ORDINALITY AS t(value, ordinality)
            ),
            existing_data AS (
              SELECT value, ordinality as existing_order
              FROM jsonb_array_elements(${messages.responseMessages}) WITH ORDINALITY AS t(value, ordinality)
            )
            SELECT jsonb_agg(
              CASE 
                WHEN nd.value IS NOT NULL THEN nd.value
                ELSE ed.value
              END
              ORDER BY COALESCE(nd.new_order, ed.existing_order)
            )
            FROM existing_data ed
            FULL OUTER JOIN new_data nd ON ed.value->>'id' = nd.value->>'id'
            WHERE COALESCE(nd.value->>'id', ed.value->>'id') IS NOT NULL
          )
        END`;
    }

    // Order-preserving merge for reasoning messages
    if (reasoningMessages?.length) {
      const newData = JSON.stringify(reasoningMessages);
      updates.reasoning = sql`
        CASE 
          WHEN ${messages.reasoning} IS NULL THEN ${newData}::jsonb
          ELSE (
            WITH new_data AS (
              SELECT value, ordinality as new_order
              FROM jsonb_array_elements(${newData}::jsonb) WITH ORDINALITY AS t(value, ordinality)
            ),
            existing_data AS (
              SELECT value, ordinality as existing_order
              FROM jsonb_array_elements(${messages.reasoning}) WITH ORDINALITY AS t(value, ordinality)
            )
            SELECT jsonb_agg(
              CASE 
                WHEN nd.value IS NOT NULL THEN nd.value
                ELSE ed.value
              END
              ORDER BY COALESCE(nd.new_order, ed.existing_order)
            )
            FROM existing_data ed
            FULL OUTER JOIN new_data nd ON ed.value->>'id' = nd.value->>'id'
            WHERE COALESCE(nd.value->>'id', ed.value->>'id') IS NOT NULL
          )
        END`;
    }

    // Order-preserving merge for raw LLM messages - handles both string and array content
    if (rawLlmMessages?.length) {
      const newData = JSON.stringify(rawLlmMessages);
      updates.rawLlmMessages = sql`
        CASE 
          WHEN ${messages.rawLlmMessages} IS NULL THEN ${newData}::jsonb
          ELSE (
            WITH new_data AS (
              SELECT 
                value, 
                ordinality as new_order,
                value->>'role' AS role,
                COALESCE(
                  CASE 
                    WHEN jsonb_typeof(value->'content') = 'array' THEN
                      (SELECT string_agg(c->>'toolCallId', ',' ORDER BY c->>'toolCallId')
                       FROM jsonb_array_elements(value->'content') c
                       WHERE c->>'toolCallId' IS NOT NULL)
                    ELSE NULL
                  END,
                  ''
                ) AS tool_calls
              FROM jsonb_array_elements(${newData}::jsonb) WITH ORDINALITY AS t(value, ordinality)
            ),
            existing_data AS (
              SELECT 
                value, 
                ordinality as existing_order,
                value->>'role' AS role,
                COALESCE(
                  CASE 
                    WHEN jsonb_typeof(value->'content') = 'array' THEN
                      (SELECT string_agg(c->>'toolCallId', ',' ORDER BY c->>'toolCallId')
                       FROM jsonb_array_elements(value->'content') c
                       WHERE c->>'toolCallId' IS NOT NULL)
                    ELSE NULL
                  END,
                  ''
                ) AS tool_calls
              FROM jsonb_array_elements(${messages.rawLlmMessages}) WITH ORDINALITY AS t(value, ordinality)
            )
            SELECT jsonb_agg(
              CASE 
                WHEN nd.value IS NOT NULL THEN nd.value
                ELSE ed.value
              END
              ORDER BY COALESCE(nd.new_order, ed.existing_order)
            )
            FROM existing_data ed
            FULL OUTER JOIN new_data nd ON (ed.role = nd.role AND ed.tool_calls = nd.tool_calls)
            WHERE COALESCE(nd.role, ed.role) IS NOT NULL
          )
        END`;
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
