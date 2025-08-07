import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../connection';
import { messages } from '../../schema';

// Temporary type definition to avoid circular dependency
// This should match the ChatMessageResponseMessage type from server-shared
type ChatMessageResponseMessage = unknown;

/**
 * Update or append to the responseMessages JSONB array for a specific message
 * @param messageId - The ID of the message to update
 * @param entry - The ChatMessageResponseMessage to update/append
 * @param mode - 'update' to replace the last entry, 'append' to add a new entry
 * @returns Success status
 */
export async function updateOrAppendResponseEntry(
  messageId: string,
  entry: ChatMessageResponseMessage,
  mode: 'update' | 'append' = 'update'
): Promise<{ success: boolean }> {
  try {
    if (mode === 'append') {
      // Append the new entry to the array using || operator
      await db
        .update(messages)
        .set({
          responseMessages: sql`COALESCE(${messages.responseMessages}, '[]'::jsonb) || ${JSON.stringify(entry)}::jsonb`,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));
    } else {
      // Update the last element in the array
      // Uses jsonb_set with the array length - 1 as the index
      await db
        .update(messages)
        .set({
          responseMessages: sql`
            CASE 
              WHEN jsonb_array_length(${messages.responseMessages}) > 0 THEN
                jsonb_set(
                  ${messages.responseMessages},
                  ARRAY[jsonb_array_length(${messages.responseMessages}) - 1]::text[],
                  ${JSON.stringify(entry)}::jsonb,
                  false
                )
              ELSE
                -- If array is empty or null, create a new array with the entry
                jsonb_build_array(${JSON.stringify(entry)}::jsonb)
            END
          `,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update/append response entry:', error);
    throw new Error(`Failed to update/append response entry for message ${messageId}`);
  }
}

// Export with a more concise name
export { updateOrAppendResponseEntry as updateLastResponseEntry };
