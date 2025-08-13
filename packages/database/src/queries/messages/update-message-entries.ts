import type { ModelMessage } from 'ai';
import { type SQL, and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../connection';
import { messages } from '../../schema';

export interface UpdateMessageEntriesParams {
  messageId: string;
  toolCallId: string;
  rawLlmMessage?: ModelMessage;
  responseEntry?: unknown;
  reasoningEntry?: unknown;
}

/**
 * Mapping of field names to their corresponding message table columns
 * This provides type-safe access to the JSONB columns we need to update
 */
const MESSAGE_FIELD_MAPPING = {
  rawLlmMessages: messages.rawLlmMessages,
  responseMessages: messages.responseMessages,
  reasoning: messages.reasoning,
} as const;

type MessageFieldName = keyof typeof MESSAGE_FIELD_MAPPING;

/**
 * Helper function to generate SQL for upserting entries in a JSONB array field.
 * Ensures only one entry exists per toolCallId - either updates the existing entry
 * or appends a new one if it doesn't exist.
 * 
 * Uses jsonb_set for efficient in-place updates instead of rebuilding the entire array.
 * This is optimized for frequent streaming updates.
 * 
 * @param fieldName - The field name to update
 * @param jsonString - Pre-stringified JSON to insert/update
 * @param toolCallId - The toolCallId for identifying the entry (must be unique)
 */
function generateJsonbArrayUpsertSql(
  fieldName: MessageFieldName,
  jsonString: string,
  toolCallId: string
): SQL {
  const field = MESSAGE_FIELD_MAPPING[fieldName];

  // Efficient approach: Find index once and use jsonb_set for updates
  // This avoids rebuilding the entire array for streaming updates
  return sql`
    CASE
      WHEN EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(${field}) AS elem 
        WHERE elem->>'id' = ${toolCallId} OR elem->>'toolCallId' = ${toolCallId}
      ) THEN
        -- Update existing entry using jsonb_set at the found index
        (SELECT jsonb_set(
          ${field},
          ARRAY[(idx - 1)::text],
          ${jsonString}::jsonb,
          false
        )
        FROM (
          SELECT row_number() OVER () AS idx, elem.value
          FROM jsonb_array_elements(${field}) AS elem
        ) AS indexed
        WHERE indexed.value->>'id' = ${toolCallId} 
           OR indexed.value->>'toolCallId' = ${toolCallId}
        LIMIT 1)
      ELSE
        -- No existing entry, append the new one
        COALESCE(${field}, '[]'::jsonb) || ${jsonString}::jsonb
    END
  `;
}

/**
 * Atomically upsert multiple message entry arrays on a single row.
 * Each entry is identified by its unique toolCallId - if an entry with that toolCallId exists,
 * it will be replaced with the new data; otherwise, a new entry will be appended.
 *
 * IMPORTANT: This function guarantees that only one entry per toolCallId will exist in each array.
 * Multiple calls with the same toolCallId will update the existing entry, not create duplicates.
 *
 * This prevents race conditions between concurrent tool updates by ensuring each tool
 * only modifies its own entries, identified by toolCallId.
 *
 * Any of the entry parameters may be omitted. If none are provided, only updatedAt is modified.
 */
export async function updateMessageEntries({
  messageId,
  toolCallId,
  rawLlmMessage,
  responseEntry,
  reasoningEntry,
}: UpdateMessageEntriesParams): Promise<{ success: boolean }> {
  try {
    const setValues: Record<string, SQL | string> = {
      updatedAt: new Date().toISOString(),
    };

    // Add each field conditionally using the upsert helper function
    // Stringify the entries before passing them to SQL to ensure proper JSONB casting
    if (rawLlmMessage) {
      setValues.rawLlmMessages = generateJsonbArrayUpsertSql(
        'rawLlmMessages',
        JSON.stringify(rawLlmMessage),
        toolCallId
      );
    }

    if (responseEntry) {
      setValues.responseMessages = generateJsonbArrayUpsertSql(
        'responseMessages',
        JSON.stringify(responseEntry),
        toolCallId
      );
    }

    if (reasoningEntry) {
      setValues.reasoning = generateJsonbArrayUpsertSql(
        'reasoning',
        JSON.stringify(reasoningEntry),
        toolCallId
      );
    }

    await db
      .update(messages)
      .set(setValues)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update message entries:', error);
    throw new Error(`Failed to update message entries for message ${messageId}`);
  }
}
