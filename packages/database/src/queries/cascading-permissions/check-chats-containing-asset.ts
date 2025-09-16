import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { chats, messages, messagesToFiles } from '../../schema';
import type { WorkspaceSharing } from '../../schema-types';

export interface ChatWithSharing {
  id: string;
  organizationId: string;
  workspaceSharing: WorkspaceSharing | null;
}

export async function checkChatsContainingAsset(
  assetId: string,
  _assetType: 'metric' | 'dashboard'
): Promise<ChatWithSharing[]> {
  const result = await db
    .selectDistinct({
      id: chats.id,
      organizationId: chats.organizationId,
      workspaceSharing: chats.workspaceSharing,
    })
    .from(messagesToFiles)
    .innerJoin(messages, eq(messages.id, messagesToFiles.messageId))
    .innerJoin(chats, eq(chats.id, messages.chatId))
    .where(
      and(
        eq(messagesToFiles.fileId, assetId),
        isNull(messagesToFiles.deletedAt),
        isNull(messages.deletedAt),
        isNull(chats.deletedAt)
      )
    );

  return result;
}
