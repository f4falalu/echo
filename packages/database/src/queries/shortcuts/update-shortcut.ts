import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { shortcuts } from '../../schema';

export const UpdateShortcutInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  instructions: z.string().min(1).optional(),
  shareWithWorkspace: z.boolean().optional(),
  updatedBy: z.string().uuid(),
});

export type UpdateShortcutInput = z.infer<typeof UpdateShortcutInputSchema>;

export async function updateShortcut(input: UpdateShortcutInput) {
  const validated = UpdateShortcutInputSchema.parse(input);

  const updateData: Record<string, unknown> = {
    updatedBy: validated.updatedBy,
    updatedAt: new Date().toISOString(),
  };

  if (validated.name !== undefined) {
    updateData.name = validated.name;
  }

  if (validated.instructions !== undefined) {
    updateData.instructions = validated.instructions;
  }

  if (validated.shareWithWorkspace !== undefined) {
    updateData.shareWithWorkspace = validated.shareWithWorkspace;
  }

  const [updated] = await db
    .update(shortcuts)
    .set(updateData)
    .where(and(eq(shortcuts.id, validated.id), isNull(shortcuts.deletedAt)))
    .returning();

  return updated;
}
