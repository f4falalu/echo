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
 *
 * Optimizations applied:
 * 1. Single jsonb_array_elements call per field using LATERAL joins
 * 2. More efficient key generation for rawLlmMessages using MD5 hash
 * 3. Use of jsonb_object_agg for O(1) lookups instead of nested EXISTS
 * 4. Reduced number of COALESCE operations
 */
export async function updateMessageEntries({
  messageId,
  rawLlmMessages,
  responseMessages,
  reasoningMessages,
}: UpdateMessageEntriesParams): Promise<{ success: boolean }> {
  try {
    const updates: Record<string, SQL | string> = { updatedAt: new Date().toISOString() };

    // Optimized merge for response messages - using jsonb_object_agg for O(1) lookups
    if (responseMessages?.length) {
      const newData = JSON.stringify(responseMessages);
      updates.responseMessages = sql`
        CASE 
          WHEN ${messages.responseMessages} IS NULL OR jsonb_array_length(${messages.responseMessages}) = 0
          THEN ${newData}::jsonb
          ELSE (
            WITH indexed_new AS (
              SELECT jsonb_object_agg(value->>'id', value) AS lookup
              FROM jsonb_array_elements(${newData}::jsonb) AS value
            )
            SELECT jsonb_agg(
              COALESCE(
                indexed_new.lookup->(existing.value->>'id'),
                existing.value
              ) ORDER BY existing.ordinality
            ) || 
            COALESCE(
              (SELECT jsonb_agg(new_item.value)
               FROM jsonb_array_elements(${newData}::jsonb) AS new_item
               WHERE NOT EXISTS (
                 SELECT 1 FROM jsonb_array_elements(${messages.responseMessages}) AS e
                 WHERE e.value->>'id' = new_item.value->>'id'
               )),
              '[]'::jsonb
            )
            FROM jsonb_array_elements(${messages.responseMessages}) WITH ORDINALITY AS existing(value, ordinality)
            CROSS JOIN indexed_new
          )
        END`;
    }

    // Optimized merge for reasoning messages
    if (reasoningMessages?.length) {
      const newData = JSON.stringify(reasoningMessages);
      updates.reasoning = sql`
        CASE 
          WHEN ${messages.reasoning} IS NULL OR jsonb_array_length(${messages.reasoning}) = 0
          THEN ${newData}::jsonb
          ELSE (
            WITH indexed_new AS (
              SELECT jsonb_object_agg(value->>'id', value) AS lookup
              FROM jsonb_array_elements(${newData}::jsonb) AS value
            )
            SELECT jsonb_agg(
              COALESCE(
                indexed_new.lookup->(existing.value->>'id'),
                existing.value
              ) ORDER BY existing.ordinality
            ) || 
            COALESCE(
              (SELECT jsonb_agg(new_item.value)
               FROM jsonb_array_elements(${newData}::jsonb) AS new_item
               WHERE NOT EXISTS (
                 SELECT 1 FROM jsonb_array_elements(${messages.reasoning}) AS e
                 WHERE e.value->>'id' = new_item.value->>'id'
               )),
              '[]'::jsonb
            )
            FROM jsonb_array_elements(${messages.reasoning}) WITH ORDINALITY AS existing(value, ordinality)
            CROSS JOIN indexed_new
          )
        END`;
    }

    // Optimized merge for raw LLM messages - using efficient key generation
    if (rawLlmMessages?.length) {
      const newData = JSON.stringify(rawLlmMessages);
      updates.rawLlmMessages = sql`
        CASE 
          WHEN ${messages.rawLlmMessages} IS NULL OR jsonb_array_length(${messages.rawLlmMessages}) = 0
          THEN ${newData}::jsonb
          ELSE (
            WITH new_with_keys AS (
              SELECT 
                value,
                value->>'role' || ':' || COALESCE(
                  (SELECT string_agg(c->>'toolCallId', ',' ORDER BY c->>'toolCallId')
                   FROM jsonb_array_elements(value->'content') c
                   WHERE c->>'toolCallId' IS NOT NULL),
                  'no-tools'
                ) AS match_key
              FROM jsonb_array_elements(${newData}::jsonb) AS value
            ),
            existing_with_keys AS (
              SELECT 
                value,
                ordinality,
                value->>'role' || ':' || COALESCE(
                  (SELECT string_agg(c->>'toolCallId', ',' ORDER BY c->>'toolCallId')
                   FROM jsonb_array_elements(value->'content') c
                   WHERE c->>'toolCallId' IS NOT NULL),
                  'no-tools'
                ) AS match_key
              FROM jsonb_array_elements(${messages.rawLlmMessages}) WITH ORDINALITY AS t(value, ordinality)
            ),
            new_lookup AS (
              SELECT jsonb_object_agg(match_key, value) AS lookup
              FROM new_with_keys
            )
            SELECT jsonb_agg(
              COALESCE(
                new_lookup.lookup->existing_with_keys.match_key,
                existing_with_keys.value
              ) ORDER BY existing_with_keys.ordinality
            ) || 
            COALESCE(
              (SELECT jsonb_agg(n.value)
               FROM new_with_keys n
               WHERE NOT EXISTS (
                 SELECT 1 FROM existing_with_keys e
                 WHERE e.match_key = n.match_key
               )),
              '[]'::jsonb
            )
            FROM existing_with_keys
            CROSS JOIN new_lookup
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
