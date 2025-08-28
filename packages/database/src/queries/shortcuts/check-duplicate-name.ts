import { and, eq, isNull, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { shortcuts } from '../../schema';

export const CheckDuplicateNameInputSchema = z.object({
  name: z.string().min(1).max(255),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  isWorkspace: z.boolean(),
  excludeId: z.string().uuid().optional(),
});

export type CheckDuplicateNameInput = z.infer<typeof CheckDuplicateNameInputSchema>;

export async function checkDuplicateName(input: CheckDuplicateNameInput): Promise<boolean> {
  const validated = CheckDuplicateNameInputSchema.parse(input);

  const conditions = [
    eq(shortcuts.name, validated.name),
    eq(shortcuts.organizationId, validated.organizationId),
    isNull(shortcuts.deletedAt),
  ];

  // Add exclude condition if updating
  if (validated.excludeId) {
    conditions.push(ne(shortcuts.id, validated.excludeId));
  }

  if (validated.isWorkspace) {
    // Check for existing workspace shortcut
    conditions.push(eq(shortcuts.sharedWithWorkspace, true));
  } else {
    // Check for existing personal shortcut
    conditions.push(eq(shortcuts.createdBy, validated.userId));
  }

  const [existing] = await db
    .select({ id: shortcuts.id })
    .from(shortcuts)
    .where(and(...conditions))
    .limit(1);

  return !!existing;
}
