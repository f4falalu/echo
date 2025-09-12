import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { shortcuts } from '../../schema';

export const GetShortcutByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export type GetShortcutByIdInput = z.infer<typeof GetShortcutByIdInputSchema>;

export async function getShortcutById(input: GetShortcutByIdInput) {
  const validated = GetShortcutByIdInputSchema.parse(input);

  const [shortcut] = await db
    .select()
    .from(shortcuts)
    .where(and(eq(shortcuts.id, validated.id), isNull(shortcuts.deletedAt)))
    .limit(1);

  return shortcut || null;
}
