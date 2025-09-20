import { checkPermission } from '@buster/access-controls';
import { getReport, getReportMetadata } from '@buster/database/queries';
import {
  GetReportParamsSchema,
  GetReportQuerySchema,
  type GetReportResponse,
} from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../../utils/response';

export async function getReportHandler(
  reportId: string,
  user: { id: string },
  _password?: string,
  _version_number?: number
): Promise<GetReportResponse> {
  // Get report metadata for access control
  let reportData: Awaited<ReturnType<typeof getReportMetadata>>;
  try {
    reportData = await getReportMetadata({ reportId });
  } catch (error) {
    console.error('Error getting report metadata:', error);
    throw new HTTPException(404, { message: 'Report not found' });
  }

  if (!reportData) {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  // Check access using existing asset permission system
  const assetPermissionResult = await checkPermission({
    userId: user.id,
    assetId: reportId,
    assetType: 'report_file',
    requiredRole: 'can_view',
    organizationId: reportData.organizationId,
    workspaceSharing: reportData.workspaceSharing,
  });

  if (!assetPermissionResult.hasAccess) {
    throw new HTTPException(403, { message: 'You do not have access to this report' });
  }

  // If access is granted, get the full report data
  const report = await getReport({
    reportId,
    userId: user.id,
    permissionRole: assetPermissionResult.effectiveRole,
  });

  const response: GetReportResponse = report;

  return response;
}

const app = new Hono()
  .get(
    '/',
    zValidator('param', GetReportParamsSchema),
    zValidator('query', GetReportQuerySchema),
    async (c) => {
      const { id: reportId } = c.req.valid('param');
      const query = c.req.valid('query');
      const { password, version_number } = query;
      const user = c.get('busterUser');

      if (!reportId) {
        throw new HTTPException(404, { message: 'Report ID is required' });
      }

      const response: GetReportResponse = await getReportHandler(
        reportId,
        user,
        password,
        version_number
      );
      return c.json(response);
    }
  )
  .onError(standardErrorHandler);

export default app;
