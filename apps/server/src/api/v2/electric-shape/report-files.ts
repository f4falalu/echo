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

  // TODO: Implement proper access control for reports
  // Should check:
  // 1. If user created the report (createdBy === userId)
  // 2. If user is in the same organization as the report
  // 3. If workspace sharing is enabled ('can_view' or 'can_edit')
  // 4. If report has individual permissions for the user
  // 5. If report is publicly accessible
  //
  // const userHasAccess = await canUserAccessReport({
  //   userId: c.get('supabaseUser').id,
  //   reportId,
  // });
  //
  // if (!userHasAccess) {
  //   throw errorResponse('You do not have access to this report', 403);
  // }

  // For now, allow access with a warning
  console.warn(
    `TODO: Implement access control for report ${reportId} for user ${c.get('supabaseUser').id}`
  );

  // Fetch the response and transform it
  const response = await createProxiedResponse(url);
  return await transformReportFilesResponse(response);
};
