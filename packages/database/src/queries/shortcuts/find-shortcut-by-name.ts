import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { shortcuts } from '../../schema';

export const FindShortcutByNameInputSchema = z.object({
  name: z.string().min(1).max(255),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type FindShortcutByNameInput = z.infer<typeof FindShortcutByNameInputSchema>;

export async function findShortcutByName(input: FindShortcutByNameInput) {
  const validated = FindShortcutByNameInputSchema.parse(input);

  // First try to find personal shortcut
  const [personalShortcut] = await db
    .select()
    .from(shortcuts)
    .where(
      and(
        eq(shortcuts.name, validated.name),
        eq(shortcuts.createdBy, validated.userId),
        eq(shortcuts.organizationId, validated.organizationId),
        isNull(shortcuts.deletedAt)
      )
    )
    .limit(1);

  if (personalShortcut) {
    return personalShortcut;
  }

  // Then try to find workspace shortcut
  const [workspaceShortcut] = await db
    .select()
    .from(shortcuts)
    .where(
      and(
        eq(shortcuts.name, validated.name),
        eq(shortcuts.organizationId, validated.organizationId),
        eq(shortcuts.shareWithWorkspace, true),
        isNull(shortcuts.deletedAt)
      )
    )
    .limit(1);

  return workspaceShortcut || null;
}
