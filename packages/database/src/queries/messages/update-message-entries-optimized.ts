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
 * Optimized version of updateMessageEntries using more efficient JSONB operations.
 * Key optimizations:
 * 1. Uses jsonb_build_object to construct lookup maps for O(1) lookups
 * 2. Reduces the number of jsonb_array_elements calls
 * 3. Simplifies the toolCallId comparison logic
 * 4. Uses more efficient CASE statements instead of complex subqueries
 */
export async function updateMessageEntriesOptimized({
  messageId,
  rawLlmMessages,
  responseMessages,
  reasoningMessages,
}: UpdateMessageEntriesParams): Promise<{ success: boolean }> {
  try {
    const updates: Record<string, SQL | string> = { updatedAt: new Date().toISOString() };

    // Optimized merge for response messages - using jsonb_object for O(1) lookups
    if (responseMessages?.length) {
      const newData = JSON.stringify(responseMessages);
      updates.responseMessages = sql`
        CASE 
          WHEN ${messages.responseMessages} IS NULL THEN ${newData}::jsonb
          ELSE (
            WITH new_map AS (
              SELECT jsonb_object_agg(value->>'id', value) AS map
              FROM jsonb_array_elements(${newData}::jsonb) AS value
              WHERE value->>'id' IS NOT NULL
            ),
            merged AS (
              SELECT jsonb_agg(
                CASE 
                  WHEN new_map.map ? (existing.value->>'id') 
                  THEN new_map.map->(existing.value->>'id')
                  ELSE existing.value
                END
                ORDER BY existing.ordinality
              ) AS result
              FROM jsonb_array_elements(${messages.responseMessages}) WITH ORDINALITY AS existing(value, ordinality)
              CROSS JOIN new_map
              UNION ALL
              SELECT jsonb_agg(new_item.value ORDER BY new_item.ordinality)
              FROM jsonb_array_elements(${newData}::jsonb) WITH ORDINALITY AS new_item(value, ordinality)
              CROSS JOIN new_map
              WHERE NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements(${messages.responseMessages}) AS existing
                WHERE existing.value->>'id' = new_item.value->>'id'
              )
            )
            SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
            FROM (
              SELECT jsonb_array_elements(result) AS value
              FROM merged
              WHERE result IS NOT NULL
            ) t
          )
        END`;
    }

    // Optimized merge for reasoning messages
    if (reasoningMessages?.length) {
      const newData = JSON.stringify(reasoningMessages);
      updates.reasoning = sql`
        CASE 
          WHEN ${messages.reasoning} IS NULL THEN ${newData}::jsonb
          ELSE (
            WITH new_map AS (
              SELECT jsonb_object_agg(value->>'id', value) AS map
              FROM jsonb_array_elements(${newData}::jsonb) AS value
              WHERE value->>'id' IS NOT NULL
            ),
            merged AS (
              SELECT jsonb_agg(
                CASE 
                  WHEN new_map.map ? (existing.value->>'id') 
                  THEN new_map.map->(existing.value->>'id')
                  ELSE existing.value
                END
                ORDER BY existing.ordinality
              ) AS result
              FROM jsonb_array_elements(${messages.reasoning}) WITH ORDINALITY AS existing(value, ordinality)
              CROSS JOIN new_map
              UNION ALL
              SELECT jsonb_agg(new_item.value ORDER BY new_item.ordinality)
              FROM jsonb_array_elements(${newData}::jsonb) WITH ORDINALITY AS new_item(value, ordinality)
              CROSS JOIN new_map
              WHERE NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements(${messages.reasoning}) AS existing
                WHERE existing.value->>'id' = new_item.value->>'id'
              )
            )
            SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
            FROM (
              SELECT jsonb_array_elements(result) AS value
              FROM merged
              WHERE result IS NOT NULL
            ) t
          )
        END`;
    }

    // Optimized merge for raw LLM messages - simplified toolCallId comparison
    if (rawLlmMessages?.length) {
      const newData = JSON.stringify(rawLlmMessages);
      updates.rawLlmMessages = sql`
        CASE 
          WHEN ${messages.rawLlmMessages} IS NULL THEN ${newData}::jsonb
          ELSE (
            WITH new_messages AS (
              SELECT 
                value,
                value->>'role' AS role,
                COALESCE(
                  (SELECT string_agg(c->>'toolCallId', ',' ORDER BY c->>'toolCallId')
                   FROM jsonb_array_elements(value->'content') c
                   WHERE c->>'toolCallId' IS NOT NULL),
                  ''
                ) AS tool_calls
              FROM jsonb_array_elements(${newData}::jsonb) AS value
            ),
            existing_messages AS (
              SELECT 
                value,
                ordinality,
                value->>'role' AS role,
                COALESCE(
                  (SELECT string_agg(c->>'toolCallId', ',' ORDER BY c->>'toolCallId')
                   FROM jsonb_array_elements(value->'content') c
                   WHERE c->>'toolCallId' IS NOT NULL),
                  ''
                ) AS tool_calls
              FROM jsonb_array_elements(${messages.rawLlmMessages}) WITH ORDINALITY AS t(value, ordinality)
            )
            SELECT COALESCE(
              jsonb_agg(value ORDER BY ord),
              '[]'::jsonb
            )
            FROM (
              -- Keep existing messages that aren't being updated
              SELECT e.value, e.ordinality AS ord
              FROM existing_messages e
              WHERE NOT EXISTS (
                SELECT 1 FROM new_messages n
                WHERE n.role = e.role AND n.tool_calls = e.tool_calls
              )
              UNION ALL
              -- Add all new messages
              SELECT n.value, 1000000 + row_number() OVER () AS ord
              FROM new_messages n
            ) combined
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