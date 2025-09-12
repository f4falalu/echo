import { and, eq, isNull, or } from 'drizzle-orm';
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

  // Single optimized query that checks both personal and workspace shortcuts
  // Personal shortcuts take precedence over workspace shortcuts
  const results = await db
    .select()
    .from(shortcuts)
    .where(
      and(
        eq(shortcuts.name, validated.name),
        eq(shortcuts.organizationId, validated.organizationId),
        isNull(shortcuts.deletedAt),
        or(
          // Personal shortcut for the user
          eq(shortcuts.createdBy, validated.userId),
          // OR workspace shortcut
          eq(shortcuts.shareWithWorkspace, true)
        )
      )
    )
    .orderBy(
      // Order by shareWithWorkspace ASC so personal (false) comes before workspace (true)
      shortcuts.shareWithWorkspace
    )
    .limit(1);

  return results[0] || null;
}
