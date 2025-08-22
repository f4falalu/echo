import { checkAssetPermission, getReport, listAssetPermissions } from '@buster/database';
import type { User } from '@buster/database';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../../../middleware/auth';

interface SharePermission {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

async function getReportSharingHandler(
  reportId: string,
  user: User
): Promise<{ permissions: SharePermission[] }> {
  // Check if report exists
  const report = await getReport({ reportId, userId: user.id });
  if (!report) {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  // Check if user has permission to view the report
  const permissionCheck = await checkAssetPermission({
    assetId: reportId,
    assetType: 'report_file',
    userId: user.id,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this report',
    });
  }

  // Get all permissions for the report
  const permissions = await listAssetPermissions({
    assetId: reportId,
    assetType: 'report_file',
  });

  // Format the permissions for the response
  const formattedPermissions: SharePermission[] = permissions.map((perm) => ({
    userId: perm.user?.id || '',
    email: perm.user?.email || '',
    name: perm.user?.name || null,
    avatarUrl: perm.user?.avatarUrl || null,
    role: perm.permission.role,
    createdAt: perm.permission.createdAt,
    updatedAt: perm.permission.updatedAt,
  }));

  return {
    permissions: formattedPermissions,
  };
}

const app = new Hono().use('*', requireAuth).get('/', async (c) => {
  const reportId = c.req.param('id');
  const user = c.get('busterUser');

  if (!reportId) {
    throw new HTTPException(400, { message: 'Report ID is required' });
  }

  const result = await getReportSharingHandler(reportId, user);

  return c.json(result);
});

export default app;
