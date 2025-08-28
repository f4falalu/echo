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
  const result: DataSourceGroupResult = {
    successes: [],
    updates: [],
    failures: [],
    deleted: [],
  };

  // Get data source
  const dataSource = await getDataSourceByName(db, dataSourceName, organizationId);

  if (!dataSource) {
    // All models for this data source fail
    for (const model of models) {
      result.failures.push({
        name: model.name,
        dataSource: dataSourceName,
        errors: [`Data source '${dataSourceName}' not found`],
      });
    }
    return result;
  }

  // Check user access
  const hasAccess = await userHasDataSourceAccess(db, dataSource.id, organizationId);

  if (!hasAccess) {
    // All models for this data source fail
    for (const model of models) {
      result.failures.push({
        name: model.name,
        dataSource: dataSourceName,
        errors: [`No access to data source '${dataSourceName}'`],
      });
    }
    return result;
  }

  // Deploy each model
  for (const model of models) {
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
  }

  return result;
}
