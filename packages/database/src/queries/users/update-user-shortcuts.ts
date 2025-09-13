import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { users } from '../../schema';

export const UpdateUserLastUsedShortcutsInputSchema = z.object({
  userId: z.string().uuid(),
  shortcutIds: z.array(z.string().uuid()),
});

export type UpdateUserLastUsedShortcutsInput = z.infer<
  typeof UpdateUserLastUsedShortcutsInputSchema
>;

/**
 * Updates the user's lastUsedShortcuts array with new shortcut IDs.
 * New shortcuts are prepended to the front of the array.
 * Duplicates are removed while maintaining the most recent usage order.
 *
 * @param input - Object containing userId and shortcutIds to add
 * @returns Success status
 */
export async function updateUserLastUsedShortcuts(
  input: UpdateUserLastUsedShortcutsInput
): Promise<{ success: boolean }> {
  const validated = UpdateUserLastUsedShortcutsInputSchema.parse(input);

  try {
    // First, get the current lastUsedShortcuts array
    const [currentUser] = await db
      .select({ lastUsedShortcuts: users.lastUsedShortcuts })
      .from(users)
      .where(eq(users.id, validated.userId))
      .limit(1);

    if (!currentUser) {
      throw new Error(`User not found: ${validated.userId}`);
    }

    const currentShortcuts = currentUser.lastUsedShortcuts || [];

    // Remove any of the new shortcuts from their current positions
    const filteredShortcuts = currentShortcuts.filter((id) => !validated.shortcutIds.includes(id));

    // Prepend the new shortcuts to the front
    const updatedShortcuts = [...validated.shortcutIds, ...filteredShortcuts];

    // Update the user record
    await db
      .update(users)
      .set({
        lastUsedShortcuts: updatedShortcuts,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, validated.userId));

    return { success: true };
  } catch (error) {
    console.error('Failed to update user last used shortcuts:', error);
    return { success: false };
  }
}
