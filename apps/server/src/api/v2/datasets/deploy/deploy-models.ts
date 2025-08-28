import type { DeployRequest, DeployResponse } from '@buster/server-shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { groupModelsByDataSource } from './group-models';
import { processDataSourceGroup } from './process-data-source-group';

/**
 * Main deployment function
 * Orchestrates the deployment of all models
 */
export async function deployModels(
  request: DeployRequest,
  userId: string,
  organizationId: string,
  db: PostgresJsDatabase
): Promise<DeployResponse> {
  const result: DeployResponse = {
    success: [],
    updated: [],
    noChange: [],
    failures: [],
    deleted: [],
    summary: {
      totalModels: request.models.length,
      successCount: 0,
      updateCount: 0,
      noChangeCount: 0,
      failureCount: 0,
      deletedCount: 0,
    },
  };

  // Group models by data source
  const modelsByDataSource = groupModelsByDataSource(request.models);

  // Process each data source group
  for (const [dataSourceName, models] of modelsByDataSource) {
    const groupResult = await processDataSourceGroup(
      dataSourceName,
      models,
      userId,
      organizationId,
      request.deleteAbsentModels !== false,
      db
    );

    // Aggregate results
    result.success.push(...groupResult.successes);
    result.updated.push(...groupResult.updates);
    result.failures.push(...groupResult.failures);
    result.deleted.push(...groupResult.deleted);

    // Update summary
    result.summary.successCount += groupResult.successes.length;
    result.summary.updateCount += groupResult.updates.length;
    result.summary.failureCount += groupResult.failures.length;
    result.summary.deletedCount += groupResult.deleted.length;
  }

  return result;
}
