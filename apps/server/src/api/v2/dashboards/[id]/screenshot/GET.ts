import { checkPermission } from '@buster/access-controls';
import { getDashboardById } from '@buster/database/queries';
import { getAssetScreenshotSignedUrl } from '@buster/search';
import { AssetIdParamsSchema, type GetScreenshotResponse } from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get('/', zValidator('param', AssetIdParamsSchema), async (c) => {
  const dashboardId = c.req.valid('param').id;
  const user = c.get('busterUser');

  const dashboard = await getDashboardById({ dashboardId });
  if (!dashboard) {
    throw new HTTPException(404, { message: 'Dashboard not found' });
  }

  const permission = await checkPermission({
    userId: user.id,
    assetId: dashboardId,
    assetType: 'dashboard_file',
    requiredRole: 'can_view',
    workspaceSharing: dashboard.workspaceSharing,
    organizationId: dashboard.organizationId,
  });

  if (!permission.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this dashboard',
    });
  }

  let signedUrl = '';
  let success = true;

  try {
    signedUrl = await getAssetScreenshotSignedUrl({
      assetType: 'dashboard_file',
      assetId: dashboardId,
      organizationId: dashboard.organizationId,
    });
  } catch (error) {
    console.error('Failed to generate dashboard screenshot URL', {
      dashboardId,
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
