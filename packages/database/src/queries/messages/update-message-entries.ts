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

const MESSAGE_FIELD_MAPPING = {
  rawLlmMessages: messages.rawLlmMessages,
  responseMessages: messages.responseMessages,
  reasoning: messages.reasoning,
} as const;

type MessageFieldName = keyof typeof MESSAGE_FIELD_MAPPING;

/**
 * Generates SQL for upserting entries in a JSONB array field using jsonb_set.
 */
function generateJsonbArrayUpsertSql(
  fieldName: MessageFieldName,
  jsonString: string,
  toolCallId: string
): SQL {
  const field = MESSAGE_FIELD_MAPPING[fieldName];

  // For rawLlmMessages, we need to check inside the content array for toolCallId
  // Structure: { role: 'assistant', content: [{ type: 'tool-call', toolCallId: '...', ... }] }
  const whereClause =
    fieldName === 'rawLlmMessages'
      ? sql`EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(elem.value->'content') AS content_elem
        WHERE content_elem->>'toolCallId' = ${toolCallId}
      )`
      : sql`elem.value->>'id' = ${toolCallId} OR elem.value->>'toolCallId' = ${toolCallId}`;

  return sql`
    CASE
      WHEN EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(COALESCE(${field}, '[]'::jsonb)) WITH ORDINALITY AS elem(value, pos)
        WHERE ${whereClause}
      ) THEN
        jsonb_set(
          COALESCE(${field}, '[]'::jsonb),
          ARRAY[(
            SELECT (elem.pos - 1)::text
            FROM jsonb_array_elements(COALESCE(${field}, '[]'::jsonb)) WITH ORDINALITY AS elem(value, pos)
            WHERE ${whereClause}
            LIMIT 1
          )],
          ${jsonString}::jsonb,
          false
        )
      ELSE
        COALESCE(${field}, '[]'::jsonb) || ${jsonString}::jsonb
    END
  `;
}

/**
 * Updates message entries atomically, ensuring only one entry per toolCallId exists.
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
