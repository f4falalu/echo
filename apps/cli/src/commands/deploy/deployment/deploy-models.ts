import { relative } from 'node:path';
import type { BusterSDK } from '@buster/sdk';
import yaml from 'js-yaml';
import { generateDefaultSQL } from '../models/parsing';
import type {
  DeployColumn,
  DeployRequest,
  DeploymentFailure,
  DeploymentItem,
  DeploymentResult,
  Model,
} from '../schemas';

/**
 * Deploy models to Buster API
 * Handles both dry-run and actual deployment
 */
export async function deployModels(
  modelFiles: Array<{ file: string; models: Model[] }>,
  sdk: BusterSDK,
  baseDir: string,
  options: { dryRun: boolean; verbose: boolean }
): Promise<DeploymentResult> {
  const result: DeploymentResult = {
    success: [],
    updated: [],
    noChange: [],
    failures: [],
    excluded: [],
  };

  // Process each file and its models
  for (const { file, models } of modelFiles) {
    const relativeFile = relative(baseDir, file);

    for (const model of models) {
      try {
        if (options.verbose) {
          console.info(`Processing model: ${model.name} from ${relativeFile}`);
        }

        // Convert model to deployment request
        const deployRequest = modelToDeployRequest(model);

        if (options.dryRun) {
          // In dry-run mode, just validate and add to success
          console.info(`[DRY RUN] Would deploy model: ${model.name}`);
          console.info(`  Data Source: ${deployRequest.data_source_name}`);
          console.info(`  Schema: ${deployRequest.schema}`);
          console.info(`  Database: ${deployRequest.database || 'N/A'}`);
          console.info(`  Columns: ${deployRequest.columns.length}`);

          result.success.push({
            file: relativeFile,
            modelName: model.name,
            dataSource: deployRequest.data_source_name,
          });
        } else {
          // Actual deployment
          const deployResult = await deploySingleModel(deployRequest, sdk);

          if (deployResult.success) {
            if (deployResult.updated) {
              result.updated.push({
                file: relativeFile,
                modelName: model.name,
                dataSource: deployRequest.data_source_name,
              });
            } else if (deployResult.noChange) {
              result.noChange.push({
                file: relativeFile,
                modelName: model.name,
                dataSource: deployRequest.data_source_name,
              });
            } else {
              result.success.push({
                file: relativeFile,
                modelName: model.name,
                dataSource: deployRequest.data_source_name,
              });
            }
          } else {
            result.failures.push({
              file: relativeFile,
              modelName: model.name,
              errors: deployResult.errors,
            });
          }
        }
      } catch (error) {
        // Handle unexpected errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.failures.push({
          file: relativeFile,
          modelName: model.name,
          errors: [errorMessage],
        });
      }
    }
  }

  return result;
}

/**
 * Deploy a single model to the API
 */
async function deploySingleModel(
  deployRequest: DeployRequest,
  sdk: BusterSDK
): Promise<{
  success: boolean;
  updated?: boolean;
  noChange?: boolean;
  errors: string[];
}> {
  try {
    // Call SDK to deploy the model
    // Note: This assumes the SDK has a deployDataset method
    // You'll need to adjust based on actual SDK implementation
    const response = await (sdk as any).datasets.deploy({
      ...deployRequest,
      // The API expects these fields
      type: 'view',
      env: 'dev',
    });

    // Check response for success/update/no-change status
    if (response.success) {
      return {
        success: true,
        updated: response.updated || false,
        noChange: response.noChange || false,
        errors: [],
      };
    } else {
      return {
        success: false,
        errors: response.errors || ['Deployment failed'],
      };
    }
  } catch (error) {
    // Handle API errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: [`API Error: ${errorMessage}`],
    };
  }
}

/**
 * Convert a semantic model to a deployment request
 */
export function modelToDeployRequest(model: Model): DeployRequest {
  const columns: DeployColumn[] = [];

  // Convert dimensions to columns
  for (const dimension of model.dimensions) {
    columns.push({
      name: dimension.name,
      description: dimension.description || '',
      semantic_type: 'dimension',
      type: dimension.type,
      searchable: dimension.searchable,
      expr: undefined,
      agg: undefined,
    });
  }

  // Convert measures to columns
  for (const measure of model.measures) {
    columns.push({
      name: measure.name,
      description: measure.description || '',
      semantic_type: 'measure',
      type: measure.type,
      searchable: false,
      expr: undefined,
      agg: undefined,
    });
  }

  // Generate SQL if not provided
  const sqlDefinition = generateDefaultSQL(model);

  // Serialize model to YAML for yml_file field
  const ymlContent = yaml.dump(model);

  // Ensure required fields are present
  if (!model.data_source_name) {
    throw new Error(`Model ${model.name} is missing data_source_name`);
  }
  if (!model.schema) {
    throw new Error(`Model ${model.name} is missing schema`);
  }

  return {
    id: undefined, // Will be set by API if updating
    data_source_name: model.data_source_name,
    env: 'dev',
    type: 'view',
    name: model.name,
    model: model.name,
    schema: model.schema,
    database: model.database,
    description: model.description || '',
    sql_definition: sqlDefinition,
    entity_relationships: undefined, // Preserved in yml_file instead
    columns,
    yml_file: ymlContent,
  };
}

/**
 * Format deployment results for display
 */
export function formatDeploymentSummary(result: DeploymentResult): string {
  const lines: string[] = [];

  lines.push('📊 Deployment Summary');
  lines.push('='.repeat(40));

  const totalDeployed = result.success.length + result.updated.length;
  lines.push(`✅ Successfully deployed: ${totalDeployed} models`);

  if (result.success.length > 0) {
    lines.push(`  ✨ New models: ${result.success.length}`);
  }

  if (result.updated.length > 0) {
    lines.push(`  🔄 Updated models: ${result.updated.length}`);
  }

  if (result.noChange.length > 0) {
    lines.push(`  ➖ No changes: ${result.noChange.length}`);
  }

  if (result.excluded.length > 0) {
    lines.push(`⛔ Excluded: ${result.excluded.length} files`);
  }

  if (result.failures.length > 0) {
    lines.push(`❌ Failed: ${result.failures.length} models`);
    lines.push('-'.repeat(40));

    for (const failure of result.failures) {
      lines.push(`  File: ${failure.file}`);
      lines.push(`  Model: ${failure.modelName}`);
      for (const error of failure.errors) {
        lines.push(`    - ${error}`);
      }
    }
  }

  lines.push('='.repeat(40));

  if (result.failures.length === 0) {
    lines.push('🎉 All models processed successfully!');
  } else {
    lines.push('⚠️  Some models failed to deploy. Please check the errors above.');
  }

  return lines.join('\n');
}
