import { resolve } from 'node:path';
import { type BusterSDK, createBusterSDK } from '@buster/sdk';
import { loadCredentials } from '../../utils/credentials';
import {
  getConfigBaseDir,
  loadBusterConfig,
  resolveConfiguration,
  resolveModelPaths,
} from './config/config-loader';
import { deployModels, formatDeploymentSummary } from './deployment/deploy-models';
import { discoverModelFiles, filterModelFiles } from './models/discovery';
import { parseModelFile, resolveModelConfig, validateModel } from './models/parsing';
import type { DeployOptions, DeploymentResult, Model } from './schemas';

/**
 * Main deploy handler that orchestrates the entire deployment pipeline
 * This is the core logic that the UI component will call
 */
export async function deployHandler(options: DeployOptions): Promise<DeploymentResult> {
  console.info('🚀 Starting Buster Deployment Process...');

  // 1. Determine base directory
  const baseDir = resolve(options.path || '.');
  console.info(`Working directory: ${baseDir}`);

  // 2. Load and resolve configuration
  console.info('🔍 Loading configuration...');
  const busterConfig = await loadBusterConfig(baseDir);
  const resolvedConfig = resolveConfiguration(busterConfig, options);

  const configBaseDir = busterConfig ? getConfigBaseDir(baseDir) : baseDir;

  // 3. Discover model files
  console.info('📁 Discovering model files...');
  const allFiles = await discoverModelFiles(
    resolvedConfig,
    configBaseDir,
    options.recursive !== false
  );

  console.info(`Found ${allFiles.length} YAML files`);

  // 4. Apply exclusion filters
  const { included, excluded } = await filterModelFiles(
    allFiles,
    resolvedConfig.exclude_files,
    configBaseDir
  );

  if (excluded.length > 0) {
    console.info(`Excluded ${excluded.length} files based on patterns`);
    if (options.verbose) {
      for (const ex of excluded) {
        console.info(`  ⛔ ${ex.file}: ${ex.reason}`);
      }
    }
  }

  // 5. Parse and validate models
  console.info('🔍 Parsing model files...');
  const modelFiles: Array<{ file: string; models: Model[] }> = [];
  const parseFailures: Array<{ file: string; error: string }> = [];

  for (const file of included) {
    try {
      const models = await parseModelFile(file);
      const resolvedModels: Model[] = [];

      for (const model of models) {
        // Resolve configuration for each model
        const resolved = resolveModelConfig(model, {
          data_source_name: resolvedConfig.data_source_name,
          database: resolvedConfig.database,
          schema: resolvedConfig.schema,
        });

        // Validate the resolved model
        const validation = validateModel(resolved);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        resolvedModels.push(resolved);
      }

      if (resolvedModels.length > 0) {
        modelFiles.push({ file, models: resolvedModels });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      parseFailures.push({ file, error: errorMessage });
      console.error(`❌ Failed to parse ${file}: ${errorMessage}`);
    }
  }

  console.info(
    `Successfully parsed ${modelFiles.length} files containing ${modelFiles.reduce(
      (sum, f) => sum + f.models.length,
      0
    )} models`
  );

  // 6. Check if we have models to deploy
  if (modelFiles.length === 0) {
    console.warn('⚠️  No valid models found to deploy');
    return {
      success: [],
      updated: [],
      noChange: [],
      failures: parseFailures.map((f) => ({
        file: f.file,
        modelName: 'unknown',
        errors: [f.error],
      })),
      excluded,
    };
  }

  // 7. Create SDK client (skip in dry-run mode)
  let sdk: BusterSDK | null = null;

  if (!options.dryRun) {
    console.info('🔐 Authenticating with Buster API...');
    const credentials = await loadCredentials();

    if (!credentials?.apiKey) {
      throw new Error('Not authenticated. Please run: buster auth');
    }

    sdk = createBusterSDK({
      apiKey: credentials.apiKey,
      apiUrl: credentials.apiUrl || 'https://api.buster.so',
    });
  } else {
    console.info('🔍 DRY RUN MODE - No API calls will be made');
  }

  // 8. Deploy models
  console.info(`🚀 Deploying ${modelFiles.length} model files...`);

  const deploymentResult = await deployModels(
    modelFiles,
    sdk as BusterSDK, // Will be null in dry-run, but deployModels handles this
    configBaseDir,
    {
      dryRun: options.dryRun,
      verbose: options.verbose,
    }
  );

  // Add parse failures to the result
  for (const failure of parseFailures) {
    deploymentResult.failures.push({
      file: failure.file,
      modelName: 'parse_error',
      errors: [failure.error],
    });
  }

  // Add excluded files to the result (they're already there from filterModelFiles)
  deploymentResult.excluded.push(...excluded);

  // 9. Display summary
  const summary = formatDeploymentSummary(deploymentResult);
  console.info('\n' + summary);

  return deploymentResult;
}

/**
 * Validate deployment options before starting
 */
export function validateDeployOptions(options: DeployOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if path exists (if provided)
  if (options.path) {
    const fs = require('fs');
    if (!fs.existsSync(options.path)) {
      errors.push(`Path does not exist: ${options.path}`);
    }
  }

  // Validate that if dataSource is provided, schema is also provided
  if (options.dataSource && !options.schema) {
    errors.push('Schema is required when dataSource is specified');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
