import type { ModelMessage } from 'ai';
import type {
  ChatMessageResponseMessage,
  ChatMessageReasoningMessage,
} from '@buster/server-shared/chats';
import { type SQL, and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../connection';
import { messages } from '../../schema';

export type UpdateMessageEntriesMode = 'update' | 'append';

export interface UpdateMessageEntriesParams {
  messageId: string;
  rawLlmMessage?: ModelMessage;
  responseEntry?: ChatMessageResponseMessage;
  reasoningEntry?: ChatMessageReasoningMessage;
  mode?: UpdateMessageEntriesMode;
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
 * Helper function to generate SQL for updating or appending to a JSONB array field
 */
function generateJsonbArraySql(
  fieldName: MessageFieldName,
  entry: unknown,
  mode: UpdateMessageEntriesMode
): SQL {
  const field = MESSAGE_FIELD_MAPPING[fieldName];
  const jsonString = JSON.stringify(entry);

  if (mode === 'append') {
    return sql`COALESCE(${field}, '[]'::jsonb) || ${jsonString}::jsonb`;
  }

  // Update mode: replace last element or create new array
  return sql`
    CASE 
      WHEN jsonb_array_length(${field}) > 0 THEN
        jsonb_set(
          ${field},
          ARRAY[jsonb_array_length(${field}) - 1]::text[],
          ${jsonString}::jsonb,
          false
        )
      ELSE
        jsonb_build_array(${jsonString}::jsonb)
    END
  `;
}

/**
 * Atomically update or append multiple message entry arrays on a single row.
 * Any of the entry parameters may be omitted. If none are provided, only updatedAt is modified.
 */
export async function updateMessageEntries({
  messageId,
  rawLlmMessage,
  responseEntry,
  reasoningEntry,
  mode = 'update',
}: UpdateMessageEntriesParams): Promise<{ success: boolean }> {
  try {
    const setValues: Record<string, SQL | string> = {
      updatedAt: new Date().toISOString(),
    };

    // Add each field conditionally using the helper function
    if (rawLlmMessage) {
      setValues.rawLlmMessages = generateJsonbArraySql('rawLlmMessages', rawLlmMessage, mode);
    }

    if (responseEntry) {
      setValues.responseMessages = generateJsonbArraySql('responseMessages', responseEntry, mode);
    }

    if (reasoningEntry) {
      setValues.reasoning = generateJsonbArraySql('reasoning', reasoningEntry, mode);
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
