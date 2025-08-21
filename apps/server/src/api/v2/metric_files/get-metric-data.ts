import { type AssetPermissionCheck, checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database';
import { getUserOrganizationId } from '@buster/database';
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
 * 5. Executes the query against the data source
 * 6. Returns the data with metadata and pagination info
 *
 * @param metricId - The ID of the metric to retrieve data for
 * @param limit - Maximum number of rows to return (default 5000, max 5000)
 * @param user - The authenticated user
 * @returns The metric data with metadata
 */
export async function getMetricDataHandler(
  metricId: string,
  limit: number = 5000,
  user: User
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

  // TODO: Implement the following steps in subsequent tickets:
  // 1. Retrieve metric definition from database
  // 2. Parse metric content (YAML/JSON) to extract SQL query
  // 3. Get data source connection details
  // 4. Execute query using appropriate data source adapter
  // 5. Process results and build metadata
  // 6. Check if there are more records beyond the limit

  // Placeholder response for now
  return {
    data: [],
    data_metadata: {
      column_count: 0,
      column_metadata: [],
      row_count: 0,
    },
    metricId,
    has_more_records: false,
  };
}