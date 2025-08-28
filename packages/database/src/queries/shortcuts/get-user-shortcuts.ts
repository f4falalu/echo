import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { shortcuts } from '../../schema';

export const GetUserShortcutsInputSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type GetUserShortcutsInput = z.infer<typeof GetUserShortcutsInputSchema>;

export async function getUserShortcuts(input: GetUserShortcutsInput) {
  const validated = GetUserShortcutsInputSchema.parse(input);

  const userShortcuts = await db
    .select()
    .from(shortcuts)
    .where(
      and(
        eq(shortcuts.organizationId, validated.organizationId),
        or(eq(shortcuts.createdBy, validated.userId), eq(shortcuts.sharedWithWorkspace, true)),
        isNull(shortcuts.deletedAt)
      )
    )
    .orderBy(asc(shortcuts.name));

  return userShortcuts;
}
