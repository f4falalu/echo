import { type AssetPermissionCheck, checkPermission } from '@buster/access-controls';
import { createAdapter } from '@buster/data-source';
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
 * 5. Executes the query against the data source
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
      dataSourceId: metric.secretId,
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

  // Create adapter and execute query
  const adapter = await createAdapter(credentials);

  try {
    // Add 1 to limit to check if there are more records
    const queryLimitWithCheck = queryLimit + 1;

    // Execute query with timeout (60 seconds)
    const queryResult = await adapter.query(
      sql,
      [], // No parameters for metric queries
      queryLimitWithCheck,
      60000 // 60 second timeout
    );

    // Check if we have more records than the requested limit
    const hasMoreRecords = queryResult.rows.length > queryLimit;

    // Trim results to requested limit if we have more
    const rawData = hasMoreRecords ? queryResult.rows.slice(0, queryLimit) : queryResult.rows;

    // Convert data to match expected type (string | number | null)
    const data = rawData.map((row) => {
      const typedRow: Record<string, string | number | null> = {};
      for (const [key, value] of Object.entries(row)) {
        if (value === null || typeof value === 'string' || typeof value === 'number') {
          typedRow[key] = value;
        } else if (typeof value === 'boolean') {
          typedRow[key] = value.toString();
        } else if (value instanceof Date) {
          typedRow[key] = value.toISOString();
        } else {
          // Convert other types to string (JSON objects, arrays, etc)
          typedRow[key] = JSON.stringify(value);
        }
      }
      return typedRow;
    });

    // Build metadata from query result with required fields
    const columnMetadata = queryResult.fields.map((field) => {
      // Determine simple type based on field type
      const simpleType =
        field.type.includes('int') ||
        field.type.includes('float') ||
        field.type.includes('decimal') ||
        field.type.includes('numeric') ||
        field.type === 'number'
          ? 'number'
          : field.type.includes('date') || field.type.includes('time')
            ? 'date'
            : 'text';

      return {
        name: field.name,
        // Map common database types to supported types
        type: (field.type.toLowerCase().includes('varchar')
          ? 'varchar'
          : field.type.toLowerCase().includes('char')
            ? 'char'
            : field.type.toLowerCase().includes('text')
              ? 'text'
              : field.type.toLowerCase().includes('int')
                ? 'integer'
                : field.type.toLowerCase().includes('float')
                  ? 'float'
                  : field.type.toLowerCase().includes('decimal')
                    ? 'decimal'
                    : field.type.toLowerCase().includes('numeric')
                      ? 'numeric'
                      : field.type.toLowerCase().includes('bool')
                        ? 'bool'
                        : field.type.toLowerCase().includes('date')
                          ? 'date'
                          : field.type.toLowerCase().includes('time')
                            ? 'timestamp'
                            : field.type.toLowerCase().includes('json')
                              ? 'json'
                              : 'text') as
          | 'text'
          | 'float'
          | 'integer'
          | 'date'
          | 'float8'
          | 'timestamp'
          | 'timestamptz'
          | 'bool'
          | 'time'
          | 'boolean'
          | 'json'
          | 'jsonb'
          | 'int8'
          | 'int4'
          | 'int2'
          | 'decimal'
          | 'char'
          | 'character varying'
          | 'character'
          | 'varchar'
          | 'number'
          | 'numeric'
          | 'tinytext'
          | 'mediumtext'
          | 'longtext'
          | 'nchar'
          | 'nvarchat'
          | 'ntext'
          | 'float4',
        min_value: '', // These would need to be calculated from actual data
        max_value: '',
        unique_values: 0,
        simple_type: simpleType as 'text' | 'number' | 'date',
      };
    });

    const dataMetadata = {
      column_count: queryResult.fields.length,
      column_metadata: columnMetadata,
      row_count: data.length,
    };

    return {
      data,
      data_metadata: dataMetadata,
      metricId,
      has_more_records: hasMoreRecords,
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
  } finally {
    // Always close the adapter connection
    await adapter.close().catch((err) => {
      console.error('Failed to close adapter connection:', err);
    });
  }
}
