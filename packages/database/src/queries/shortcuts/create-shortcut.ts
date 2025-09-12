import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { shortcuts } from '../../schema';

export const CreateShortcutInputSchema = z.object({
  name: z.string().min(1).max(255),
  instructions: z.string().min(1),
  createdBy: z.string().uuid(),
  organizationId: z.string().uuid(),
  shareWithWorkspace: z.boolean(),
});

export type CreateShortcutInput = z.infer<typeof CreateShortcutInputSchema>;

export async function createShortcut(input: CreateShortcutInput) {
  const validated = CreateShortcutInputSchema.parse(input);

  // Use transaction to ensure atomicity and prevent race conditions
  return await db.transaction(async (tx) => {
    // Check for existing active shortcut with same name
    const [existingActive] = await tx
      .select()
      .from(shortcuts)
      .where(
        and(
          eq(shortcuts.name, validated.name),
          eq(shortcuts.organizationId, validated.organizationId),
          validated.shareWithWorkspace
            ? eq(shortcuts.shareWithWorkspace, true)
            : eq(shortcuts.createdBy, validated.createdBy),
          isNull(shortcuts.deletedAt)
        )
      )
      .limit(1);

    if (existingActive) {
      // Shortcut already exists and is active
      throw new Error(`Shortcut with name '${validated.name}' already exists`);
    }

    // Check if there's a soft-deleted shortcut with the same name
    const [existingDeleted] = await tx
      .select()
      .from(shortcuts)
      .where(
        and(
          eq(shortcuts.name, validated.name),
          eq(shortcuts.organizationId, validated.organizationId),
          validated.shareWithWorkspace
            ? eq(shortcuts.shareWithWorkspace, true)
            : eq(shortcuts.createdBy, validated.createdBy),
          isNotNull(shortcuts.deletedAt)
        )
      )
      .limit(1);

    if (existingDeleted) {
      // Upsert: restore the soft-deleted record with new data
      const [restored] = await tx
        .update(shortcuts)
        .set({
          instructions: validated.instructions,
          shareWithWorkspace: validated.shareWithWorkspace,
          updatedBy: validated.createdBy,
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        })
        .where(eq(shortcuts.id, existingDeleted.id))
        .returning();

      return restored;
    }

    // Create new shortcut
    try {
      const [created] = await tx
        .insert(shortcuts)
        .values({
          name: validated.name,
          instructions: validated.instructions,
          createdBy: validated.createdBy,
          updatedBy: validated.createdBy,
          organizationId: validated.organizationId,
          shareWithWorkspace: validated.shareWithWorkspace,
        })
        .returning();

      return created;
    } catch (error: any) {
      // Handle unique constraint violation
      if (error?.code === '23505' && error?.constraint?.includes('unique')) {
        throw new Error(`Shortcut with name '${validated.name}' already exists`);
      }
      throw error;
    }
  });
}
