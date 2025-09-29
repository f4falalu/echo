import { checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import { getChatWithDetails, getMessagesForChatWithUserDetails } from '@buster/database/queries';
import { GetChatRequestSchema, type GetChatResponse } from '@buster/server-shared/chats';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { throwUnauthorizedError } from '../../../../shared-helpers/asset-public-access';
import { buildChatWithMessages } from '../services/chat-helpers';

interface GetChatHandlerParams {
  chatId: string;
  user: User;
}

const app = new Hono().get('/', zValidator('param', GetChatRequestSchema), async (c) => {
  const { id } = c.req.valid('param');
  const user = c.get('busterUser');

  console.info(`Processing GET request for chat with ID: ${id}, user_id: ${user.id}`);

  const response: GetChatResponse = await getChatHandler({ chatId: id, user });

  return c.json(response);
});

export default app;

/**
 * Handler to retrieve a chat by ID with messages and permissions
 * This is the TypeScript equivalent of the Rust get_chat_handler
 */
export async function getChatHandler(params: GetChatHandlerParams): Promise<GetChatResponse> {
  const { chatId, user } = params;

  // Fetch chat with messages and related data
  const chatData = await getChatWithDetails({
    chatId,
    userId: user.id,
  });

  if (!chatData) {
    console.warn(`Chat not found: ${chatId}`);
    throw new HTTPException(404, {
      message: 'Chat not found',
    });
  }

  const { chat, user: creator } = chatData;

  // Check permissions using the access control system
  const { hasAccess, effectiveRole } = await checkPermission({
    userId: user.id,
    assetId: chatId,
    assetType: 'chat',
    requiredRole: 'can_view',
    organizationId: chat.organizationId,
    workspaceSharing: chat.workspaceSharing || 'none',
    publiclyAccessible: chat.publiclyAccessible || false,
    publicExpiryDate: chat.publicExpiryDate ?? undefined,
  });

  if (!hasAccess || !effectiveRole) {
    throwUnauthorizedError({
      publiclyAccessible: chat.publiclyAccessible || false,
      publicExpiryDate: chat.publicExpiryDate ?? undefined,
    });
  }

  const messages = await getMessagesForChatWithUserDetails(chatId);

  const response: GetChatResponse = await buildChatWithMessages(
    chat,
    messages,
    creator,
    effectiveRole
  );

  return response;
}
