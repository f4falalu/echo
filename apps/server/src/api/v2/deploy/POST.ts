import { db } from '@buster/database/connection';
import {
  getDataSourceByName,
  getUserOrganizationId,
  upsertDataset,
  upsertDoc,
} from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { deploy } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

type UnifiedDeployRequest = deploy.UnifiedDeployRequest;
type UnifiedDeployResponse = deploy.UnifiedDeployResponse;
type ModelDeployResult = deploy.ModelDeployResult;
type DocDeployResult = deploy.DocDeployResult;

/**
 * Deploy handler for unified model and doc deployment
 * Orchestrates deployment using simple database operations
 */
export async function deployHandler(
  request: UnifiedDeployRequest,
  user: User
): Promise<UnifiedDeployResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg || !userOrg.organizationId) {
    throw new HTTPException(401, {
      message: 'User is not associated with an organization',
    });
  }

  // Check permissions
  if (userOrg.role !== 'workspace_admin' && userOrg.role !== 'data_admin') {
    throw new HTTPException(403, {
      message: 'Insufficient permissions. Only workspace admins and data admins can deploy.',
    });
  }

  try {
    // Use a transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      const modelResult: ModelDeployResult = {
        success: [],
        updated: [],
        failures: [],
        deleted: [],
        summary: {
          totalModels: request.models.length,
          successCount: 0,
          updateCount: 0,
          failureCount: 0,
          deletedCount: 0,
        },
      };

      const docResult: DocDeployResult = {
        created: [],
        updated: [],
        deleted: [],
        failed: [],
        summary: {
          totalDocs: request.docs.length,
          createdCount: 0,
          updatedCount: 0,
          deletedCount: 0,
          failedCount: 0,
        },
      };

      // Deploy models
      for (const model of request.models) {
        try {
          // Get data source ID
          const dataSource = await getDataSourceByName(
            tx,
            model.data_source_name,
            userOrg.organizationId
          );

          if (!dataSource) {
            modelResult.failures.push({
              name: model.name,
              errors: [`Data source '${model.data_source_name}' not found`],
            });
            modelResult.summary.failureCount++;
            continue;
          }

          // Transform model to dataset params (columns are deprecated)
          const datasetParams = {
            name: model.name,
            dataSourceId: dataSource.id,
            organizationId: userOrg.organizationId,
            database: model.database,
            schema: model.schema,
            description: model.description,
            sql_definition: model.sql_definition,
            yml_file: model.yml_file,
            userId: user.id,
          };

          // Upsert the dataset
          const { updated } = await upsertDataset(tx, datasetParams);

          if (updated) {
            modelResult.updated.push({
              name: model.name,
              dataSource: model.data_source_name,
            });
            modelResult.summary.updateCount++;
          } else {
            modelResult.success.push({
              name: model.name,
              dataSource: model.data_source_name,
            });
            modelResult.summary.successCount++;
          }
        } catch (error) {
          console.error(`Failed to deploy model ${model.name}:`, error);
          modelResult.failures.push({
            name: model.name,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          });
          modelResult.summary.failureCount++;
        }
      }

      // Deploy docs
      for (const doc of request.docs) {
        try {
          const docParams = {
            name: doc.name,
            content: doc.content,
            type: doc.type as 'analyst' | 'normal',
            organizationId: userOrg.organizationId,
          };

          await upsertDoc(docParams);

          // Check if it was created or updated (simplified - we'd need to track this)
          docResult.created.push(doc.name);
          docResult.summary.createdCount++;
        } catch (error) {
          console.error(`Failed to deploy doc ${doc.name}:`, error);
          docResult.failed.push({
            name: doc.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          docResult.summary.failedCount++;
        }
      }

      // TODO: Handle soft deletion of absent models/docs if requested
      // This would require additional database functions to:
      // 1. List all current models for the data sources
      // 2. Soft delete those not in the deployment list
      // if (request.deleteAbsentModels) { ... }
      // if (request.deleteAbsentDocs) { ... }

      return {
        models: modelResult,
        docs: docResult,
      };
    });

    return result;
  } catch (error) {
    console.error('[deployHandler] Deployment failed:', error);

    // Re-throw HTTPExceptions as-is
    if (error instanceof HTTPException) {
      throw error;
    }

    // Wrap other errors
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : 'Deployment failed',
    });
  }
}
