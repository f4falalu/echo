import {
  bulkCreateAssetPermissions,
  checkAssetPermission,
  findUsersByEmails,
  getReport,
} from '@buster/database';
import type { User } from '@buster/database';
import type { SharePostRequest } from '@buster/server-shared/share';
import { SharePostRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function createReportSharingHandler(
  reportId: string,
  shareRequests: SharePostRequest,
  user: User
): Promise<{ success: boolean; shared: string[]; notFound: string[] }> {
  // Check if report exists
  const report = await getReport({ reportId, userId: user.id });
  if (!report) {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  // Check if user has permission to share the report
  const permissionCheck = await checkAssetPermission({
    assetId: reportId,
    assetType: 'report_file',
    userId: user.id,
  });

  // Check if user has at least full_access permission
  if (
    !permissionCheck.hasAccess ||
    (permissionCheck.role !== 'full_access' && permissionCheck.role !== 'owner')
  ) {
    throw new HTTPException(403, {
      message: 'You do not have permission to share this report',
    });
  }

  // Extract emails from the share requests
  const emails = shareRequests.map((req) => req.email);

  // Find users by emails
  const userMap = await findUsersByEmails(emails);

  const permissions = [];
  const sharedEmails = [];
  const notFoundEmails = [];

  for (const shareRequest of shareRequests) {
    const targetUser = userMap.get(shareRequest.email);

    if (!targetUser) {
      notFoundEmails.push(shareRequest.email);
      continue;
    }

    sharedEmails.push(shareRequest.email);

    // Map ShareRole to AssetPermissionRole
    const roleMapping = {
      owner: 'owner',
      full_access: 'full_access',
      can_edit: 'can_edit',
      can_filter: 'can_filter',
      can_view: 'can_view',
      viewer: 'can_view', // Map viewer to can_view
    } as const;

    permissions.push({
      identityId: targetUser.id,
      identityType: 'user' as const,
      assetId: reportId,
      assetType: 'report_file' as const,
      role: roleMapping[shareRequest.role] || 'can_view',
      createdBy: user.id,
    });
  }

  // Create permissions in bulk
  if (permissions.length > 0) {
    await bulkCreateAssetPermissions({ permissions });
  }

  return {
    success: true,
    shared: sharedEmails,
    notFound: notFoundEmails,
  };
}

const app = new Hono().post('/', zValidator('json', SharePostRequestSchema), async (c) => {
  const reportId = c.req.param('id');
  const shareRequests = c.req.valid('json');
  const user = c.get('busterUser');

  if (!reportId) {
    throw new HTTPException(400, { message: 'Report ID is required' });
  }

  const result = await createReportSharingHandler(reportId, shareRequests, user);

  return c.json(result);
});

export default app;
