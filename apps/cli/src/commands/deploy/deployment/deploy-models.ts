import { relative } from 'node:path';
import type { BusterSDK } from '@buster/sdk';
import type { DeployRequest, DeployResponse } from '@buster/server-shared';
import yaml from 'js-yaml';
import { generateDefaultSQL } from '../models/parsing';
import type {
  CLIDeploymentResult,
  DeployColumn,
  DeployModel,
  DeploymentFailure,
  DeploymentItem,
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
  options: { dryRun: boolean; verbose: boolean; deleteAbsentModels?: boolean }
): Promise<CLIDeploymentResult> {
  const result: CLIDeploymentResult = {
    success: [],
    updated: [],
    noChange: [],
    failures: [],
    excluded: [],
  };

  // Collect all deploy models
  const deployModels: DeployModel[] = [];
  const modelFileMap = new Map<string, string>(); // modelName -> file

  for (const { file, models } of modelFiles) {
    const relativeFile = relative(baseDir, file);

    for (const model of models) {
      try {
        if (options.verbose) {
          console.info(`Processing model: ${model.name} from ${relativeFile}`);
        }

        // Convert model to deployment request format
        const deployModel = modelToDeployRequest(model);
        deployModels.push(deployModel);
        modelFileMap.set(model.name, relativeFile);

        if (options.dryRun) {
          // In dry-run mode, just validate and log what would happen
          console.info(`[DRY RUN] Would deploy model: ${model.name}`);
          console.info(`  Data Source: ${deployModel.data_source_name}`);
          console.info(`  Schema: ${deployModel.schema}`);
          console.info(`  Database: ${deployModel.database || 'N/A'}`);
          console.info(`  Columns: ${deployModel.columns.length}`);
        }
      } catch (error) {
        // Handle model conversion errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.failures.push({
          file: relativeFile,
          modelName: model.name,
          errors: [errorMessage],
        });
      }
    }
  }

  // Return early if dry run
  if (options.dryRun) {
    for (const model of deployModels) {
      const file = modelFileMap.get(model.name) || 'unknown';
      result.success.push({
        file,
        modelName: model.name,
        dataSource: model.data_source_name,
      });
    }
    return result;
  }

  // Perform actual deployment
  try {
    const deployRequest: DeployRequest = {
      models: deployModels,
      deleteAbsentModels: options.deleteAbsentModels !== false,
    };

    const response: DeployResponse = await sdk.datasets.deploy(deployRequest);

    // Process response
    for (const item of response.success) {
      const file = modelFileMap.get(item.name) || 'unknown';
      result.success.push({
        file,
        modelName: item.name,
        dataSource: item.dataSource,
      });
    }

    for (const item of response.updated) {
      const file = modelFileMap.get(item.name) || 'unknown';
      result.updated.push({
        file,
        modelName: item.name,
        dataSource: item.dataSource,
      });
    }

    for (const item of response.noChange) {
      const file = modelFileMap.get(item.name) || 'unknown';
      result.noChange.push({
        file,
        modelName: item.name,
        dataSource: item.dataSource,
      });
    }

    for (const failure of response.failures) {
      const file = modelFileMap.get(failure.name) || 'unknown';
      result.failures.push({
        file,
        modelName: failure.name,
        errors: failure.errors,
      });
    }

    // Log deleted models if any
    if (response.deleted && response.deleted.length > 0) {
      console.info(
        `\n🗑️  Soft-deleted ${response.deleted.length} models not included in deployment:`
      );
      for (const name of response.deleted) {
        console.info(`   - ${name}`);
      }
    }
  } catch (error) {
    // Handle API errors - add all models as failures
    const errorMessage = error instanceof Error ? error.message : String(error);

    for (const model of deployModels) {
      const file = modelFileMap.get(model.name) || 'unknown';
      result.failures.push({
        file,
        modelName: model.name,
        errors: [`API Error: ${errorMessage}`],
      });
    }
  }

  return result;
}

/**
 * Convert a semantic model to a deployment request
 */
export function modelToDeployRequest(model: Model): DeployModel {
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
    name: model.name,
    data_source_name: model.data_source_name,
    schema: model.schema,
    database: model.database,
    description: model.description || '',
    sql_definition: sqlDefinition,
    columns,
    yml_file: ymlContent,
    metrics: model.metrics,
    filters: model.filters,
    relationships: model.relationships,
  };
}

/**
 * Format deployment results for display
 */
export function formatDeploymentSummary(result: CLIDeploymentResult): string {
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
