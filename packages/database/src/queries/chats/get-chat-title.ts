import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { chats } from '../../schema';

export const GetChatTitleInputSchema = z.object({
  assetId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
});

export type GetChatTitleInput = z.infer<typeof GetChatTitleInputSchema>;

export async function getChatTitle(input: GetChatTitleInput): Promise<string | null> {
  const validated = GetChatTitleInputSchema.parse(input);

  const [chat] = await db
    .select({
      title: chats.title,
      publiclyAccessible: chats.publiclyAccessible,
      organizationId: chats.organizationId,
    })
    .from(chats)
    .where(and(eq(chats.id, validated.assetId), isNull(chats.deletedAt)))
    .limit(1);

  if (!chat) {
    return null;
  }

  if (!chat.publiclyAccessible && chat.organizationId !== validated.organizationId) {
    return null;
  }

  return chat.title;
}
