import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { shortcuts } from '../../schema';

export const DeleteShortcutInputSchema = z.object({
  id: z.string().uuid(),
  deletedBy: z.string().uuid(),
});

export type DeleteShortcutInput = z.infer<typeof DeleteShortcutInputSchema>;

export async function deleteShortcut(input: DeleteShortcutInput) {
  const validated = DeleteShortcutInputSchema.parse(input);

  const [deleted] = await db
    .update(shortcuts)
    .set({
      deletedAt: new Date().toISOString(),
      updatedBy: validated.deletedBy,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(shortcuts.id, validated.id), isNull(shortcuts.deletedAt)))
    .returning();

  return deleted;
}
