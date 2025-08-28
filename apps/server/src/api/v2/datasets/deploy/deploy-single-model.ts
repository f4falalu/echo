import { upsertDataset } from '@buster/database';
import type { DeployModel, DeploymentFailure, DeploymentItem } from '@buster/server-shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { validateModel } from './validate-model';

export interface DeployModelResult {
  success: boolean;
  item?: DeploymentItem;
  failure?: DeploymentFailure;
  updated?: boolean;
}

/**
 * Deploy a single model
 * Pure function that returns deployment result
 */
export async function deploySingleModel(
  model: DeployModel,
  dataSourceName: string,
  dataSourceId: string,
  userId: string,
  organizationId: string,
  db: PostgresJsDatabase
): Promise<DeployModelResult> {
  // Validate model first
  const validationErrors = validateModel(model);
  if (validationErrors.length > 0) {
    return {
      success: false,
      failure: {
        name: model.name,
        dataSource: dataSourceName,
        errors: validationErrors,
      },
    };
  }

  try {
    // Upsert dataset using database package function
    // Cast to unknown then any to handle type mismatch between server-shared and database's local types
    // This is necessary because database package uses local types to avoid circular dependencies
    const result = await upsertDataset(
      db,
      model as unknown as Parameters<typeof upsertDataset>[1],
      userId,
      organizationId,
      dataSourceId
    );

    const item: DeploymentItem = {
      name: model.name,
      dataSource: dataSourceName,
      schema: model.schema,
      database: model.database,
    };

    return {
      success: true,
      item,
      updated: result.updated,
    };
  } catch (error) {
    return {
      success: false,
      failure: {
        name: model.name,
        dataSource: dataSourceName,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
    };
  }
}
