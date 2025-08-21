import { hasAssetPermission } from '@buster/access-controls';
import { type ReportElementsWithIds, getReportMetadata, type reportFiles } from '@buster/database';
import type { GetReportResponse } from '@buster/server-shared/reports';
import { markdownToPlatejs } from '@buster/server-utils/report';
import type { Context } from 'hono';
import { errorResponse } from '../../../utils/response';
import { createProxiedResponse, extractParamFromWhere } from './_helpers';
import {
  type TransformCallback,
  createElectricHandledResponse,
} from './_helpers/transform-request';

type StreamableReportProperties = Pick<typeof reportFiles.$inferSelect, 'name' | 'id' | 'content'>;
type ReportFile = Partial<GetReportResponse>;
type ReportMetadata = Awaited<ReturnType<typeof getReportMetadata>>;

export const reportFilesProxyRouter = async (
  url: URL,
  _userId: string,
  c: Context
): Promise<Response> => {
  const reportId = extractParamFromWhere(url, 'id');

  if (!reportId) {
    throw errorResponse('Report ID (id) is required', 403);
  }

  // Get report metadata for access control
  let reportData: ReportMetadata;
  try {
    reportData = await getReportMetadata({ reportId });
  } catch (error) {
    console.error('Error getting report metadata:', error);
    throw errorResponse('Report not found', 404);
  }

  if (!reportData) {
    throw errorResponse('Report not found', 404);
  }

  // Check access using existing asset permission system
  const hasAccess = await hasAssetPermission({
    userId: c.get('supabaseUser').id,
    assetId: reportId,
    assetType: 'report_file',
    requiredRole: 'can_view',
    organizationId: reportData.organizationId,
    workspaceSharing: reportData.workspaceSharing,
  });

  if (!hasAccess) {
    throw errorResponse('You do not have access to this report', 403);
  }

  // Fetch the response and transform it
  const response = await createProxiedResponse(url);

  return createElectricHandledResponse<StreamableReportProperties, ReportFile>(response, {
    transformCallback,
  });
};

const transformCallback: TransformCallback<StreamableReportProperties, ReportFile> = async ({
  value: { content, ...values },
}) => {
  const returnValue: ReportFile = values;

  if (content) {
    const { elements, error } = await markdownToPlatejs(content);
    if (error) console.error('Error transforming report content:', error);
    else returnValue.content = elements as ReportElementsWithIds; //why do I need as here? makes no gorey damn sense
  }

  return returnValue;
};
