import {
  getDataSourceByName,
  softDeleteDatasetsNotIn,
  userHasDataSourceAccess,
} from '@buster/database';
import type { DeployModel, DeploymentFailure, DeploymentItem } from '@buster/server-shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { deploySingleModel } from './deploy-single-model';

export interface DataSourceGroupResult {
  successes: DeploymentItem[];
  updates: DeploymentItem[];
  failures: DeploymentFailure[];
  deleted: string[];
}

/**
 * Process all models for a single data source
 * Handles validation, access checks, deployment, and cleanup
 */
export async function processDataSourceGroup(
  dataSourceName: string,
  models: DeployModel[],
  userId: string,
  organizationId: string,
  deleteAbsentModels: boolean,
  db: PostgresJsDatabase
): Promise<DataSourceGroupResult> {
  const debug = process.env.BUSTER_DEBUG === 'true';
  
  console.info(`[processDataSourceGroup] Processing ${models.length} models for data source: ${dataSourceName}`);
  
  const result: DataSourceGroupResult = {
    successes: [],
    updates: [],
    failures: [],
    deleted: [],
  };

  // Get data source
  const dataSource = await getDataSourceByName(db, dataSourceName, organizationId);

  if (!dataSource) {
    console.error(`[processDataSourceGroup] Data source '${dataSourceName}' not found for organization ${organizationId}`);
    // All models for this data source fail
    for (const model of models) {
      result.failures.push({
        name: model.name,
        dataSource: dataSourceName,
        errors: [`Data source '${dataSourceName}' not found. Run 'buster datasource list' to see available data sources.`],
      });
    }
    return result;
  }
  
  if (debug) {
    console.info(`[processDataSourceGroup] Found data source: ${dataSource.id}`);
  }

  // Check user access
  const hasAccess = await userHasDataSourceAccess(db, dataSource.id, organizationId);

  if (!hasAccess) {
    console.error(`[processDataSourceGroup] User lacks access to data source '${dataSourceName}'`);
    // All models for this data source fail
    for (const model of models) {
      result.failures.push({
        name: model.name,
        dataSource: dataSourceName,
        errors: [`No access to data source '${dataSourceName}'. Contact your administrator for access.`],
      });
    }
    return result;
  }

  // Deploy each model
  console.info(`[processDataSourceGroup] Starting deployment of ${models.length} models`);
  
  let processedCount = 0;
  for (const model of models) {
    processedCount++;
    
    if (debug) {
      console.info(`[processDataSourceGroup] Deploying model ${processedCount}/${models.length}: ${model.name}`);
    }
    
    const deployResult = await deploySingleModel(
      model,
      dataSourceName,
      dataSource.id,
      userId,
      organizationId,
      db
    );

    if (deployResult.success && deployResult.item) {
      if (deployResult.updated) {
        result.updates.push(deployResult.item);
      } else {
        result.successes.push(deployResult.item);
      }
    } else if (deployResult.failure) {
      result.failures.push(deployResult.failure);
    }
  }

  // Log summary for this data source
  console.info(`[processDataSourceGroup] Completed ${dataSourceName}: ${result.successes.length} created, ${result.updates.length} updated, ${result.failures.length} failed`);

  // Soft delete absent models if requested
  if (deleteAbsentModels) {
    const modelNames = models.map((m) => m.name);
    const deletedNames = await softDeleteDatasetsNotIn(
      db,
      modelNames,
      dataSource.id,
      organizationId
    );
    result.deleted = deletedNames;
    
    if (deletedNames.length > 0) {
      console.info(`[processDataSourceGroup] Soft-deleted ${deletedNames.length} absent models from ${dataSourceName}`);
      if (debug) {
        console.info(`[processDataSourceGroup] Deleted models:`, deletedNames);
      }
    }
  }

  return result;
}
