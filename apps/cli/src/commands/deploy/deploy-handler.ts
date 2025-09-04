import { relative, resolve } from 'node:path';
import { getConfigBaseDir, loadBusterConfig, resolveConfiguration } from './config/config-loader';
import {
  createParseFailures,
  formatDeploymentSummary,
  mergeDeploymentResults,
  processDeploymentResponse,
} from './deployment/results';
import {
  type DeployFunction,
  createAuthenticatedDeployer,
  createDryRunDeployer,
} from './deployment/strategies';
import {
  createModelFileMap,
  prepareDeploymentRequest,
  validateModelsForDeployment,
} from './deployment/transformers';
import { discoverModelFiles, filterModelFiles } from './models/discovery';
import {
  formatZodIssues,
  formatZodIssuesWithContext,
  parseModelFile,
  resolveModelConfig,
  validateModel,
} from './models/parsing';
import type { CLIDeploymentResult, DeployOptions, Model, ProjectContext } from './schemas';

/**
 * Main deploy handler that orchestrates the entire deployment pipeline
 * using functional composition
 */
export async function deployHandler(options: DeployOptions): Promise<CLIDeploymentResult> {
  // Set debug environment variable if debug mode is enabled
  if (options.debug) {
    process.env.BUSTER_DEBUG = 'true';
    console.info('Debug mode enabled - detailed logging will be shown');
  }

  // 1. Determine base directory
  const baseDir = resolve(options.path || '.');

  console.info(`Deploying from ${baseDir}`);

  // 2. Load configuration (required)
  const { config: busterConfig, configPath } = await loadBusterConfig(baseDir);
  const configBaseDir = getConfigBaseDir(configPath);

  // 3. Create deployment function based on mode
  const deploy = options.dryRun
    ? createDryRunDeployer(options.verbose)
    : await createAuthenticatedDeployer();

  // 4. Process all projects in parallel
  const projectResults = await Promise.all(
    busterConfig.projects.map((project) => processProject(project, configBaseDir, deploy, options))
  );

  // 5. Merge results from all projects (pure function)
  const finalResult = mergeDeploymentResults(projectResults);

  // 6. Display summary
  const summary = formatDeploymentSummary(finalResult, options.verbose, options.dryRun);
  console.info(summary);

  return finalResult;
}

/**
 * Process a single project - this is where the composition happens
 */
async function processProject(
  project: ProjectContext,
  configBaseDir: string,
  deploy: DeployFunction,
  options: DeployOptions
): Promise<CLIDeploymentResult> {
  console.info(`\nProcessing ${project.name} project...`);

  const resolvedConfig = resolveConfiguration({ projects: [project] }, options, project.name);

  // 1. Discover model files (I/O)
  const allFiles = await discoverModelFiles(resolvedConfig, configBaseDir);
  console.info(`  ✓ Found ${allFiles.length} model files`);

  // 2. Apply exclusion filters (pure)
  const { included, excluded } = await filterModelFiles(
    allFiles,
    resolvedConfig.exclude,
    configBaseDir
  );

  if (excluded.length > 0 && options.verbose) {
    console.info(`  ⛔ Excluded ${excluded.length} files based on patterns`);
    for (const ex of excluded) {
      console.info(`    - ${ex.file}: ${ex.reason}`);
    }
  }

  // 3. Parse and collect models (I/O + pure validation)
  const { models, parseFailures, todoFiles } = await parseAndCollectModels(
    included,
    resolvedConfig,
    configBaseDir,
    options
  );

  if (parseFailures.length > 0 && !options.verbose) {
    console.info(`  ✗ Failed to parse ${parseFailures.length} files`);
  }
  
  console.info(`  ✓ Parsed ${models.length} models successfully`);
  if (todoFiles.length > 0) {
    console.info(`  ⚠ Skipped ${todoFiles.length} files with TODOs`);
  }

  // 4. Check if we have models to deploy
  if (models.length === 0) {
    if (!parseFailures.length && !todoFiles.length) {
      console.warn(`  ⚠ No models found`);
    }
    return {
      success: [],
      updated: [],
      noChange: [],
      failures: createParseFailures(parseFailures, configBaseDir),
      excluded,
      todos: todoFiles.map(tf => ({ file: relative(configBaseDir, tf.file) })),
    };
  }

  // 5. Validate models for deployment (pure)
  const { valid: validModels, invalid } = validateModelsForDeployment(models);

  // Add validation failures to parse failures
  const allFailures = [
    ...parseFailures,
    ...invalid.map(({ model, errors }) => ({
      file: 'validation',
      error: `Model ${model.name}: ${errors.join(', ')}`,
    })),
  ];

  if (validModels.length === 0) {
    return {
      success: [],
      updated: [],
      noChange: [],
      failures: createParseFailures(allFailures, configBaseDir),
      excluded,
      todos: todoFiles.map(tf => ({ file: relative(configBaseDir, tf.file) })),
    };
  }

  // 6. Prepare deployment request (pure)
  const deployRequest = prepareDeploymentRequest(validModels);

  // 7. Create model-to-file mapping for result processing (pure)
  const modelFileMap = createModelFileMap(
    included.map((file) => ({
      file: relative(configBaseDir, file),
      models: validModels.filter(
        (_m) =>
          // Find models that came from this file
          // This is a simplified approach - in real implementation,
          // we'd track this during parsing
          true
      ),
    }))
  );

  // 8. Execute deployment (I/O via strategy function)
  // Deployment happens in the background, summary will show results

  try {
    const response = await deploy(deployRequest);

    // 9. Process response (pure)
    const result = processDeploymentResponse(response, modelFileMap);

    // Add parse failures, exclusions, and TODO files
    result.failures.push(...createParseFailures(allFailures, configBaseDir));
    result.excluded.push(...excluded);
    result.todos = todoFiles.map(tf => ({ file: relative(configBaseDir, tf.file) }));

    // Log deleted models if any (only in verbose mode)
    if (options.verbose && response.deleted && response.deleted.length > 0) {
      console.info(
        `  ℹ Soft-deleted ${response.deleted.length} models not included in deployment`
      );
      for (const name of response.deleted) {
        console.info(`    - ${name}`);
      }
    }

    return result;
  } catch (error) {
    // Handle deployment error
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Deployment failed: ${errorMessage}`);

    return {
      success: [],
      updated: [],
      noChange: [],
      failures: validModels.map((model) => ({
        file: modelFileMap.get(model.name) || 'unknown',
        modelName: model.name,
        errors: [`Deployment error: ${errorMessage}`],
      })),
      excluded,
      todos: [],
    };
  }
}

/**
 * Parse and collect models from files
 * Now collects ALL errors from ALL models instead of stopping at the first error
 */
async function parseAndCollectModels(
  files: string[],
  config: {
    data_source_name?: string | undefined;
    database?: string | undefined;
    schema?: string | undefined;
  },
  baseDir: string,
  options?: DeployOptions
): Promise<{ 
  models: Model[]; 
  parseFailures: Array<{ file: string; error: string }>; 
  todoFiles: Array<{ file: string }> 
}> {
  const models: Model[] = [];
  const parseFailures: Array<{ file: string; error: string }> = [];
  const todoFiles: Array<{ file: string }> = [];

  // Process all files and collect all errors
  await Promise.all(
    files.map(async (file) => {
      const relativeFile = relative(baseDir, file);

      try {
        const parseResult = await parseModelFile(file);

        // Collect Zod validation errors
        if (parseResult.errors.length > 0) {
          for (const errorGroup of parseResult.errors) {
            // Use context-aware formatting if raw data is available
            const formattedIssues = errorGroup.rawData 
              ? formatZodIssuesWithContext(errorGroup.issues, errorGroup.rawData)
              : formatZodIssues(errorGroup.issues);
            
            // Check if this is a TODO skip message
            if (formattedIssues.length === 1 && formattedIssues[0]?.includes('{{TODO}} markers')) {
              todoFiles.push({ file: relativeFile });
            } else {
              const modelPrefix = errorGroup.modelName ? `Model '${errorGroup.modelName}': ` : '';
              for (const issue of formattedIssues) {
                parseFailures.push({
                  file: relativeFile,
                  error: `${modelPrefix}${issue}`,
                });
              }
            }
          }
        }

        // Process successfully parsed models
        for (const model of parseResult.models) {
          // Resolve configuration for each model
          const resolved = resolveModelConfig(model, config);

          // Validate the resolved model against business rules
          const validation = validateModel(resolved);
          if (!validation.valid) {
            // Add each validation error separately for better visibility
            for (const error of validation.errors) {
              parseFailures.push({
                file: relativeFile,
                error: `Model '${resolved.name}': ${error}`,
              });
            }
            // Add TODO markers as special errors
            for (const todo of validation.todos) {
              parseFailures.push({
                file: relativeFile,
                error: `Model '${resolved.name}': TODO - ${todo}`,
              });
            }
          } else {
            models.push(resolved);
          }
        }
      } catch (error) {
        // Handle file-level errors (e.g., file read errors, invalid YAML)
        const errorMessage = error instanceof Error ? error.message : String(error);
        parseFailures.push({ file: relativeFile, error: errorMessage });
      }
    })
  );

  // Log all errors at once for better visibility (only in verbose mode)
  if (parseFailures.length > 0 && options?.verbose) {
    console.error(
      `  ✗ Found ${parseFailures.length} validation error${parseFailures.length === 1 ? '' : 's'}:`
    );
    for (const failure of parseFailures) {
      console.error(`    ${failure.file}: ${failure.error}`);
    }
  }

  return { models, parseFailures, todoFiles };
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
    const fs = require('node:fs');
    if (!fs.existsSync(options.path)) {
      errors.push(`Path does not exist: ${options.path}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
