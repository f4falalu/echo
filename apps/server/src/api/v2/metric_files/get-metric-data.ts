import { type AssetPermissionCheck, checkPermission } from '@buster/access-controls';
import { executeMetricQuery } from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import type { User } from '@buster/database';
import {
  extractSqlFromMetricContent,
  getDataSourceCredentials,
  getMetricWithDataSource,
  getUserOrganizationId,
} from '@buster/database';
import type { MetricDataResponse } from '@buster/server-shared/metrics';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for retrieving metric data
 *
 * This handler:
 * 1. Validates user has access to the organization
 * 2. Checks user has permission to view the metric file
 * 3. Retrieves the metric definition
 * 4. Parses the metric content to extract SQL
 * 5. Executes the query against the data source using the shared utility
 * 6. Returns the data with metadata and pagination info
 *
 * @param metricId - The ID of the metric to retrieve data for
 * @param user - The authenticated user
 * @param limit - Maximum number of rows to return (default 5000, max 5000)
 * @param versionNumber - Optional version number to retrieve specific metric version
 * @returns The metric data with metadata
 */
export async function getMetricDataHandler(
  metricId: string,
  user: User,
  limit = 5000,
  versionNumber?: number
): Promise<MetricDataResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to access metric data',
    });
  }

  const { organizationId } = userOrg;

  // Check if user has permission to view this metric file
  const permissionCheck: AssetPermissionCheck = {
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_view',
    organizationId,
  };

  const permissionResult = await checkPermission(permissionCheck);

  if (!permissionResult.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this metric',
    });
  }

  // Ensure limit is within bounds
  const queryLimit = Math.min(Math.max(limit, 1), 5000);

  // Retrieve metric definition from database with data source info
  const metric = await getMetricWithDataSource({ metricId, versionNumber });

  if (!metric) {
    throw new HTTPException(404, {
      message: 'Metric not found',
    });
  }

  // Verify metric belongs to user's organization
  if (metric.organizationId !== organizationId) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this metric',
    });
  }

  // Extract SQL query from metric content
  const sql = extractSqlFromMetricContent(metric.content);

  // Get data source credentials from vault
  let credentials: Credentials;
  try {
    const rawCredentials = await getDataSourceCredentials({
      dataSourceId: metric.dataSourceId,
    });

    // Ensure credentials have the correct type
    credentials = {
      ...rawCredentials,
      type: rawCredentials.type || metric.dataSourceType,
    } as Credentials;
  } catch (error) {
    console.error('Failed to retrieve data source credentials:', error);
    throw new HTTPException(500, {
      message: 'Failed to access data source',
    });
  }

  // Execute query using the shared utility
  try {
    const result = await executeMetricQuery(metric.dataSourceId, sql, credentials, {
      maxRows: queryLimit,
      timeout: 60000, // 60 seconds
      retryDelays: [1000, 3000, 6000], // 1s, 3s, 6s
    });

    return {
      data: result.data,
      data_metadata: result.dataMetadata,
      metricId,
      has_more_records: result.hasMoreRecords,
    };
  } catch (error) {
    console.error('Query execution failed:', error);

    if (error instanceof Error) {
      throw new HTTPException(500, {
        message: `Query execution failed: ${error.message}`,
      });
    }

    throw new HTTPException(500, {
      message: 'Query execution failed',
    });
  }
}
