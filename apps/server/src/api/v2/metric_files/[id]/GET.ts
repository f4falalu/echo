import { checkPermission } from '@buster/access-controls';
import {
  getAssetsAssociatedWithMetric,
  getMetricFileById,
  getOrganizationMemberCount,
  getUser,
  getUsersWithMetricPermissions,
} from '@buster/database';
import type { User } from '@buster/database';
import {
  DEFAULT_CHART_THEME,
  GetMetricParamsSchema,
  GetMetricQuerySchema,
  type GetMetricResponse,
} from '@buster/server-shared/metrics';
import type { ChartConfigProps, DataMetadata, MetricYml } from '@buster/server-shared/metrics';
import type { VerificationStatus } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import yaml from 'js-yaml';
import { standardErrorHandler } from '../../../../utils/response';

interface GetMetricHandlerParams {
  metricId: string;
  versionNumber?: number | undefined;
  password?: string | undefined;
}

const app = new Hono()
  .get(
    '/',
    zValidator('param', GetMetricParamsSchema),
    zValidator('query', GetMetricQuerySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const { password, version_number } = c.req.valid('query');
      const user = c.get('busterUser');

      console.info(
        `Processing GET request for metric with ID: ${id}, user_id: ${user.id}, version_number: ${version_number}`
      );

      const response: GetMetricResponse = await getMetricHandler(
        {
          metricId: id,
          versionNumber: version_number,
          password,
        },
        user
      );

      return c.json(response);
    }
  )
  .onError(standardErrorHandler);

export default app;

/**
 * Handler to retrieve a metric by ID with optional version number
 * This is the TypeScript equivalent of the Rust get_metric_handler
 */
async function getMetricHandler(
  params: GetMetricHandlerParams,
  user: User
): Promise<GetMetricResponse> {
  const { metricId, versionNumber, password } = params;

  // Fetch metric details with permissions
  const metricFile = await getMetricFileById(metricId);

  if (!metricFile) {
    console.warn(`Metric file not found: ${metricId}`);
    throw new HTTPException(404, {
      message: 'Metric file not found',
    });
  }

  let { hasAccess, effectiveRole } = await checkPermission({
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_view',
    organizationId: metricFile.organizationId,
    workspaceSharing: metricFile.workspaceSharing || 'none',
  });

  // Check public access
  if (!hasAccess) {
    if (!metricFile.publiclyAccessible) {
      console.warn(`Permission denied for user ${user.id} to metric ${metricId}`);
      throw new HTTPException(403, {
        message: "You don't have permission to view this metric",
      });
    }

    // Check if public access has expired
    const today = new Date();
    if (metricFile.publicExpiryDate && new Date(metricFile.publicExpiryDate) < today) {
      console.warn(`Public access expired for metric ${metricId}`);
      throw new HTTPException(403, {
        message: 'Public access to this metric has expired',
      });
    }

    // Check password if required
    if (metricFile.publicPassword) {
      if (!password) {
        console.warn(`Public password required for metric ${metricId}`);
        throw new HTTPException(418, {
          message: 'Password required for public access',
        });
      }

      if (password !== metricFile.publicPassword) {
        console.warn(`Incorrect public password for metric ${metricId}`);
        throw new HTTPException(403, {
          message: 'Incorrect password for public access',
        });
      }
    }

    hasAccess = true;
    effectiveRole = 'can_view';
  }

  if (!hasAccess || !effectiveRole) {
    // This should never be hit because we have already checked for public access
    console.warn(`Permission denied for user ${user.id} to metric ${metricId}`);
    throw new HTTPException(403, {
      message: "You don't have permission to view this metric",
    });
  }

  // Resolve version-specific data
  let resolvedContent: MetricYml;
  let resolvedName: string;
  let resolvedDescription: string | null;
  let resolvedTimeFrame: string;
  let resolvedChartConfig: ChartConfigProps;
  let resolvedSql: string;
  let resolvedUpdatedAt: string;
  let resolvedVersionNum: number;

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

      const versionContent = version.content as MetricYml;
      resolvedContent = versionContent;
      resolvedName = versionContent.name;
      resolvedDescription = versionContent.description;
      resolvedTimeFrame = versionContent.timeFrame;
      resolvedChartConfig = versionContent.chartConfig;
      resolvedSql = versionContent.sql;
      resolvedUpdatedAt = version.updated_at;
      resolvedVersionNum = version.version_number;
    } else {
      throw new HTTPException(404, {
        message: `Version ${versionNumber} not found`,
      });
    }
  } else {
    // Use current/latest version
    const currentContent = metricFile.content as MetricYml;
    resolvedContent = currentContent;
    resolvedName = metricFile.name;
    resolvedDescription = currentContent.description;
    resolvedTimeFrame = currentContent.timeFrame;
    resolvedChartConfig = currentContent.chartConfig;
    resolvedSql = currentContent.sql;
    resolvedUpdatedAt = metricFile.updatedAt;

    // Determine latest version number
    const maxVersion = Math.max(...versions.map((v) => v.version_number), 1);
    resolvedVersionNum = maxVersion;
  }

  // Color fallback was apart of v1 api logic
  if (!resolvedChartConfig.colors) {
    resolvedChartConfig.colors = DEFAULT_CHART_THEME;
  }

  const fileYaml = yaml.dump(resolvedContent);

  // Get the extra metric info concurrently
  const [individualPermissions, workspaceMemberCount, associatedAssets, publicEnabledBy] =
    await Promise.all([
      getUsersWithMetricPermissions({ metricId }),
      getOrganizationMemberCount(metricFile.organizationId),
      getAssetsAssociatedWithMetric(metricFile.id, user.id),
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
    name: resolvedName,
    version_number: resolvedVersionNum,
    error: null,
    description: resolvedDescription,
    file_name: metricFile.fileName,
    time_frame: resolvedTimeFrame,
    data_source_id: metricFile.dataSourceId,
    chart_config: resolvedChartConfig,
    data_metadata: metricFile.dataMetadata as DataMetadata,
    status: metricFile.verification as VerificationStatus,
    file: fileYaml,
    created_at: metricFile.createdAt,
    updated_at: resolvedUpdatedAt,
    sent_by_id: metricFile.createdBy,
    sent_by_name: '',
    sent_by_avatar_url: null,
    sql: resolvedSql,
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

async function getPubliclyEnabledByUser(enabledById: string | null): Promise<string | null> {
  if (enabledById) {
    const publicEnabledByUser = await getUser({ id: enabledById });
    return publicEnabledByUser.email;
  }
  return null;
}
