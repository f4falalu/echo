import { upsertDataset, type ParsedDatabaseError } from '@buster/database';
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
  const debug = process.env.BUSTER_DEBUG === 'true';
  
  if (debug) {
    console.info(`[deploySingleModel] Starting deployment for model: ${model.name}`);
  }

  // Validate model first
  const validationErrors = validateModel(model);
  if (validationErrors.length > 0) {
    console.warn(`[deploySingleModel] Validation failed for model ${model.name}:`, validationErrors);
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

    if (debug) {
      console.info(`[deploySingleModel] Successfully deployed model ${model.name} (${result.updated ? 'updated' : 'created'})`);
    }

    return {
      success: true,
      item,
      updated: result.updated,
    };
  } catch (error) {
    // Extract parsed error if available
    const parsedError = (error as any)?.parsedError as ParsedDatabaseError | undefined;
    
    // Log the error with context
    console.error(`[deploySingleModel] Failed to deploy model ${model.name}:`, {
      modelName: model.name,
      dataSource: dataSourceName,
      errorType: parsedError?.type || 'unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      constraint: parsedError?.constraint,
      table: parsedError?.table,
      column: parsedError?.column,
    });

    if (debug && error instanceof Error) {
      console.error(`[deploySingleModel] Full error stack:`, error.stack);
    }

    // Create user-friendly error messages
    const errorMessages: string[] = [];
    if (error instanceof Error) {
      errorMessages.push(error.message);
    } else {
      errorMessages.push('Unknown deployment error');
    }

    return {
      success: false,
      failure: {
        name: model.name,
        dataSource: dataSourceName,
        errors: errorMessages,
      },
    };
  }
}
