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
  const startTime = Date.now();
  const debug = process.env.BUSTER_DEBUG === 'true';
  
  console.info(`[deployModels] Starting deployment of ${request.models.length} models for organization ${organizationId}`);
  
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
  
  console.info(`[deployModels] Processing ${modelsByDataSource.size} data source(s)`);
  if (debug) {
    for (const [dsName, models] of modelsByDataSource) {
      console.info(`[deployModels]   - ${dsName}: ${models.length} models`);
    }
  }

  // Process each data source group
  let dataSourceIndex = 0;
  for (const [dataSourceName, models] of modelsByDataSource) {
    dataSourceIndex++;
    console.info(`[deployModels] Processing data source ${dataSourceIndex}/${modelsByDataSource.size}: ${dataSourceName}`);
    
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

  const duration = Date.now() - startTime;
  console.info(`[deployModels] Deployment completed in ${duration}ms`);
  console.info(`[deployModels] Summary: ${result.summary.successCount} created, ${result.summary.updateCount} updated, ${result.summary.failureCount} failed, ${result.summary.deletedCount} deleted`);

  return result;
}
