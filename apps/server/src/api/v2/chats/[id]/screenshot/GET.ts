import { checkPermission } from '@buster/access-controls';
import { getChatById } from '@buster/database/queries';
import { getAssetScreenshotSignedUrl } from '@buster/search';
import { AssetIdParamsSchema, type GetScreenshotResponse } from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get('/', zValidator('param', AssetIdParamsSchema), async (c) => {
  const { id } = c.req.valid('param');
  const user = c.get('busterUser');

  const chat = await getChatById(id);
  if (!chat) {
    throw new HTTPException(404, { message: 'Chat not found' });
  }

  const permission = await checkPermission({
    userId: user.id,
    assetId: id,
    assetType: 'chat',
    requiredRole: 'can_view',
    workspaceSharing: chat.workspaceSharing,
    organizationId: chat.organizationId,
  });

  if (!permission.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this chat',
    });
  }

  let signedUrl = '';
  let success = true;

  try {
    signedUrl = await getAssetScreenshotSignedUrl({
      assetType: 'chat',
      assetId: id,
      organizationId: chat.organizationId,
    });
  } catch (error) {
    console.error('Failed to generate chat screenshot URL', {
      chatId: id,
      error,
    });
    success = false;
  }

  const response: GetScreenshotResponse = {
    success,
    url: signedUrl,
  };
  return c.json(response);
});

export default app;
