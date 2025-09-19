import { checkPermission } from '@buster/access-controls';
import {
  type User,
  getAssetsAssociatedWithMetric,
  getCollectionsAssociatedWithDashboard,
  getDashboardById,
  getMetricFileById,
  getOrganizationMemberCount,
  getUser,
  getUsersWithDashboardPermissions,
  getUsersWithMetricPermissions,
} from '@buster/database/queries';
import {
  GetDashboardParamsSchema,
  GetDashboardQuerySchema,
  type GetDashboardResponse,
} from '@buster/server-shared/dashboards';
import type { DashboardYml } from '@buster/server-shared/dashboards';
import {
  DEFAULT_CHART_THEME,
  type DataMetadata,
  type GetMetricResponse,
  type Metric,
  type MetricYml,
} from '@buster/server-shared/metrics';
import type { VerificationStatus } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import yaml from 'js-yaml';

interface GetDashboardHandlerParams {
  dashboardId: string;
  versionNumber?: number | undefined;
  password?: string | undefined;
}

const app = new Hono().get(
  '/',
  zValidator('param', GetDashboardParamsSchema),
  zValidator('query', GetDashboardQuerySchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const { password, version_number } = c.req.valid('query');
    const user = c.get('busterUser');

    console.info(
      `Processing GET request for dashboard with ID: ${id}, user_id: ${user.id}, version_number: ${version_number}`
    );

    const response: GetDashboardResponse = await getDashboardHandler(
      {
        dashboardId: id,
        versionNumber: version_number,
        password,
      },
      user
    );

    return c.json(response);
  }
);

export default app;

/**
 * Handler to retrieve a dashboard by ID with optional version number
 * This is the TypeScript equivalent of the Rust get_dashboard_handler
 */
async function getDashboardHandler(
  params: GetDashboardHandlerParams,
  user: User
): Promise<GetDashboardResponse> {
  const { dashboardId, versionNumber, password } = params;

  // Fetch dashboard details
  const dashboardFile = await getDashboardById({ dashboardId });

  if (!dashboardFile) {
    console.warn(`Dashboard file not found: ${dashboardId}`);
    throw new HTTPException(404, {
      message: 'Dashboard not found',
    });
  }

  let { hasAccess, effectiveRole } = await checkPermission({
    userId: user.id,
    assetId: dashboardId,
    assetType: 'dashboard_file',
    requiredRole: 'can_view',
    organizationId: dashboardFile.organizationId,
    workspaceSharing: dashboardFile.workspaceSharing || 'none',
  });

  // Check public access
  if (!hasAccess) {
    if (!dashboardFile.publiclyAccessible) {
      console.warn(`Permission denied for user ${user.id} to dashboard ${dashboardId}`);
      throw new HTTPException(403, {
        message: "You don't have permission to view this dashboard",
      });
    }

    // Check if public access has expired
    const today = new Date();
    if (dashboardFile.publicExpiryDate && new Date(dashboardFile.publicExpiryDate) < today) {
      console.warn(`Public access expired for dashboard ${dashboardId}`);
      throw new HTTPException(403, {
        message: 'Public access to this dashboard has expired',
      });
    }

    // Check password if required
    if (dashboardFile.publicPassword) {
      if (!password) {
        console.warn(`Public password required for dashboard ${dashboardId}`);
        // I'm a teapot error code for password required
        throw new HTTPException(418, {
          message: 'Password required for public access',
        });
      }

      if (password !== dashboardFile.publicPassword) {
        console.warn(`Incorrect public password for dashboard ${dashboardId}`);
        throw new HTTPException(403, {
          message: 'Incorrect password for public access',
        });
      }
    }

    hasAccess = true;
    effectiveRole = 'can_view';
  }

  if (!hasAccess || !effectiveRole) {
    // This should never be hit because we have already thrown errors for no public access
    console.warn(`Permission denied for user ${user.id} to dashboard ${dashboardId}`);
    throw new HTTPException(403, {
      message: "You don't have permission to view this dashboard",
    });
  }

  // Resolve version-specific data
  let resolvedContent: DashboardYml;
  let resolvedName: string;
  let resolvedDescription: string | null;
  let resolvedUpdatedAt: string;
  let resolvedVersionNum: number;

  // Parse version history
  const versionHistory = dashboardFile.versionHistory;
  const versions: Array<{ version_number: number; updated_at: string }> = [];

  Object.values(versionHistory).forEach((version) => {
    versions.push({
      version_number: version.version_number,
      updated_at: version.updated_at,
    });
  });
  versions.sort((a, b) => a.version_number - b.version_number);

  // Get requested version if included in the request
  if (versionNumber) {
    const requestedVersionNumToString = versionNumber.toString();

    if (versionHistory[requestedVersionNumToString]) {
      const version = versionHistory[requestedVersionNumToString];

      if (!version || !version.content) {
        throw new HTTPException(404, {
          message: `Version ${versionNumber} not found`,
        });
      }

      const versionContent = version.content as DashboardYml;
      resolvedContent = versionContent;
      resolvedName = versionContent.name;
      resolvedDescription = versionContent.description;
      resolvedUpdatedAt = version.updated_at;
      resolvedVersionNum = version.version_number;
    } else {
      throw new HTTPException(404, {
        message: `Version ${versionNumber} not found`,
      });
    }
  } else {
    // Use current/latest version
    const currentContent = dashboardFile.content as DashboardYml;
    resolvedContent = currentContent;
    resolvedName = dashboardFile.name;
    resolvedDescription = currentContent.description;
    resolvedUpdatedAt = dashboardFile.updatedAt;

    // Determine latest version number
    const maxVersion = Math.max(...versions.map((v) => v.version_number), 1);
    resolvedVersionNum = maxVersion;
  }

  const fileYaml = yaml.dump(resolvedContent);

  // Extract metric IDs from dashboard config
  const metricIds = extractMetricIds(resolvedContent);

  const metrics = await getMetricsFromDashboardMetricIds(metricIds, user.id);

  // Get the extra dashboard info concurrently
  const [individualPermissions, workspaceMemberCount, collections, publicEnabledBy] =
    await Promise.all([
      getUsersWithDashboardPermissions({ dashboardId }),
      getOrganizationMemberCount(dashboardFile.organizationId),
      getCollectionsAssociatedWithDashboard(dashboardId, user.id),
      getPubliclyEnabledByUser(dashboardFile.publiclyEnabledBy),
    ]);

  // Build the response
  const response: GetDashboardResponse = {
    access: effectiveRole,
    metrics,
    dashboard: {
      config: resolvedContent,
      created_at: dashboardFile.createdAt,
      created_by: dashboardFile.createdBy,
      deleted_at: null,
      description: resolvedDescription,
      id: dashboardFile.id,
      name: resolvedName,
      updated_at: resolvedUpdatedAt,
      updated_by: dashboardFile.createdBy,
      status: 'verified' as VerificationStatus,
      version_number: resolvedVersionNum,
      file: fileYaml,
      file_name: dashboardFile.fileName,
    },
    collections,
    versions,
    individual_permissions: individualPermissions,
    publicly_accessible: dashboardFile.publiclyAccessible,
    public_expiry_date: dashboardFile.publicExpiryDate,
    public_enabled_by: publicEnabledBy,
    public_password: dashboardFile.publicPassword,
    permission: effectiveRole,
    workspace_sharing: dashboardFile.workspaceSharing,
    workspace_member_count: workspaceMemberCount,
  };

  return response;
}

/**
 * Extract metric IDs from dashboard content
 */
function extractMetricIds(content: DashboardYml): string[] {
  try {
    if (!content.rows) {
      return [];
    }

    const metricIds = content.rows.flatMap((row) => row.items?.map((item) => item.id) || []);

    return metricIds;
  } catch (error) {
    console.error('Error extracting metric IDs from dashboard content:', error);
    throw new HTTPException(500, {
      message: `Error extracting metric IDs from dashboard content: ${error}`,
    });
  }
}

async function getPubliclyEnabledByUser(enabledById: string | null): Promise<string | null> {
  if (enabledById) {
    const publicEnabledByUser = await getUser({ id: enabledById });
    return publicEnabledByUser.email;
  }
  return null;
}

async function getMetricsFromDashboardMetricIds(
  metricIds: string[],
  userId: string
): Promise<Record<string, Metric>> {
  const metricsObj: Record<string, Metric> = {};
  const promises: Promise<Metric>[] = metricIds.map((metricId) =>
    getMetricFileForDashboard(metricId, userId)
  );
  const metrics = await Promise.all(promises);
  for (const metric of metrics) {
    metricsObj[metric.id] = metric;
  }
  return metricsObj;
}

async function getMetricFileForDashboard(metricId: string, userId: string): Promise<Metric> {
  // Fetch metric details with permissions
  const metricFile = await getMetricFileById(metricId);

  if (!metricFile) {
    console.warn(`Metric file not found: ${metricId}`);
    throw new HTTPException(404, {
      message: 'Metric file not found',
    });
  }

  let { effectiveRole } = await checkPermission({
    userId: userId,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_view',
    organizationId: metricFile.organizationId,
    workspaceSharing: metricFile.workspaceSharing || 'none',
  });

  // If user has no access, grant can_view because we have already checked dashboard public access
  effectiveRole = effectiveRole || 'can_view';

  // Parse version history
  const versionHistory = metricFile.versionHistory;
  const versions: Array<{ version_number: number; updated_at: string }> = [];

  Object.values(versionHistory).forEach((version) => {
    versions.push({
      version_number: version.version_number,
      updated_at: version.updated_at,
    });
  });
  versions.sort((a, b) => a.version_number - b.version_number);

  // Use current/latest version
  const content = metricFile.content as MetricYml;
  const description = content.description;
  const timeFrame = content.timeFrame;
  const chartConfig = content.chartConfig;
  const sql = content.sql;
  const updatedAt = metricFile.updatedAt;
  const versionNum = Math.max(...versions.map((v) => v.version_number), 1);

  // Color fallback was apart of v1 api logic
  if (!chartConfig.colors) {
    chartConfig.colors = DEFAULT_CHART_THEME;
  }

  const fileYaml = yaml.dump(content);

  // Get the extra metric info concurrently
  const [individualPermissions, workspaceMemberCount, associatedAssets, publicEnabledBy] =
    await Promise.all([
      getUsersWithMetricPermissions({ metricId }),
      getOrganizationMemberCount(metricFile.organizationId),
      getAssetsAssociatedWithMetric(metricFile.id, userId),
      getPubliclyEnabledByUser(metricFile.publiclyEnabledBy),
    ]);

  const { dashboards, collections } = associatedAssets;

  // Not used but still exists in frontend code so including it here
  const evaluationScore = (() => {
    if (!metricFile.evaluationScore) {
      return 'Low';
    }
    if (metricFile.evaluationScore > 0.8) {
      return 'High';
    }
    if (metricFile.evaluationScore > 0.5) {
      return 'Moderate';
    }
    return 'Low';
  })();

  // Build the response
  const response: GetMetricResponse = {
    id: metricFile.id,
    type: 'metric_file',
    name: metricFile.name,
    version_number: versionNum,
    error: null,
    description,
    file_name: metricFile.fileName,
    time_frame: timeFrame,
    data_source_id: metricFile.dataSourceId,
    chart_config: chartConfig,
    data_metadata: metricFile.dataMetadata as DataMetadata,
    status: metricFile.verification as VerificationStatus,
    file: fileYaml,
    created_at: metricFile.createdAt,
    updated_at: updatedAt,
    sent_by_id: metricFile.createdBy,
    sent_by_name: '',
    sent_by_avatar_url: null,
    sql,
    dashboards,
    collections,
    versions,
    evaluation_score: evaluationScore,
    evaluation_summary: metricFile.evaluationSummary || '',
    permission: effectiveRole,
    individual_permissions: individualPermissions,
    publicly_accessible: metricFile.publiclyAccessible,
    public_expiry_date: metricFile.publicExpiryDate,
    public_enabled_by: publicEnabledBy,
    public_password: metricFile.publicPassword,
    workspace_sharing: metricFile.workspaceSharing,
    workspace_member_count: workspaceMemberCount,
  };

  return response;
}
