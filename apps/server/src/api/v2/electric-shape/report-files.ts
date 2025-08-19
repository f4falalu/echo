import { type WorkspaceSharing, hasAssetPermission } from '@buster/access-controls';
import { and, db, eq, isNull, reportFiles } from '@buster/database';
import { markdownToPlatejs } from '@buster/server-utils/report';
import type { Context } from 'hono';
import { errorResponse } from '../../../utils/response';
import { createProxiedResponse, extractParamFromWhere } from './_helpers';

// Types for Electric SQL response format
interface ElectricDataRow<T> {
  value: T;
  key: string;
  headers: {
    last?: boolean;
    relation: string[];
    operation: string;
    lsn: string;
    op_position: number;
    txids: number[];
  };
}

interface ElectricControlMessage {
  headers: {
    control: string;
    global_last_seen_lsn?: string;
  };
}

type ElectricResponse<T> = Array<ElectricDataRow<T> | ElectricControlMessage>;

// Type for report_files table row
interface ReportFileRow {
  id: string;
  name: string;
  content: string; // This is what we'll transform
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  publicly_accessible: boolean;
  publicly_enabled_by?: string | null;
  public_expiry_date?: string | null;
  version_history: Record<
    string,
    {
      content: string;
      updated_at: string;
      version_number: number;
    }
  >;
  public_password?: string | null;
  workspace_sharing: string;
  workspace_sharing_enabled_by?: string | null;
  workspace_sharing_enabled_at?: string | null;
}

/**
 * Transform the content field from markdown to PlateJS format
 */
export async function transformReportFilesResponse(response: Response): Promise<Response> {
  const data = (await response.json()) as ElectricResponse<ReportFileRow>;

  // Transform content field for data rows
  const transformedData = await Promise.all(
    data.map(async (item) => {
      // Type guard to check if this is a data row (not a control message)
      if ('value' in item && item.value.content) {
        const { elements, error } = await markdownToPlatejs(item.value.content);

        if (error) {
          console.error('Error transforming report content:', error);
          // Keep original content if transformation fails
          return item;
        }

        // Replace content with PlateJS elements
        return {
          ...item,
          value: {
            ...item.value,
            content: JSON.stringify(elements),
          },
        };
      }

      // Return control messages and other data unchanged
      return item;
    })
  );

  // Return new response with same headers
  return new Response(JSON.stringify(transformedData), {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export const reportFilesProxyRouter = async (url: URL, _userId: string, c: Context) => {
  const reportId = extractParamFromWhere(url, 'id');

  if (!reportId) {
    throw errorResponse('Report ID (id) is required', 403);
  }

  // Get report metadata for access control
  const reportData = await db
    .select({
      organizationId: reportFiles.organizationId,
      workspaceSharing: reportFiles.workspaceSharing,
    })
    .from(reportFiles)
    .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)))
    .limit(1);

  if (!reportData[0]) {
    throw errorResponse('Report not found', 404);
  }

  // Check access using existing asset permission system
  const hasAccess = await hasAssetPermission({
    userId: c.get('supabaseUser').id,
    assetId: reportId,
    assetType: 'report_file',
    requiredRole: 'can_view',
    organizationId: reportData[0].organizationId,
    workspaceSharing: reportData[0].workspaceSharing as WorkspaceSharing,
  });

  if (!hasAccess) {
    throw errorResponse('You do not have access to this report', 403);
  }

  // Fetch the response and transform it
  const response = await createProxiedResponse(url);
  return await transformReportFilesResponse(response);
};
