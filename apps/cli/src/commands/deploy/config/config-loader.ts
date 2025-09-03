import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import yaml from 'js-yaml';
import {
  type BusterConfig,
  BusterConfigSchema,
  type DeployOptions,
  type ResolvedConfig,
  ResolvedConfigSchema,
} from '../schemas';

/**
 * Find and load buster.yml configuration file
 * Searches in the given path and parent directories
 * @throws Error if no buster.yml is found
 */
export async function loadBusterConfig(searchPath = '.'): Promise<BusterConfig> {
  const absolutePath = resolve(searchPath);
  let currentPath = absolutePath;

  // Search for buster.yml in current and parent directories
  while (currentPath !== '/') {
    const configPath = join(currentPath, 'buster.yml');

    if (existsSync(configPath)) {
      const content = await readFile(configPath, 'utf-8');
      const rawConfig = yaml.load(content) as unknown;

      // Validate and parse with Zod schema
      const result = BusterConfigSchema.safeParse(rawConfig);

      if (result.success) {
        return result.data;
      }
      throw new Error(`Invalid buster.yml at ${configPath}`);
    }

    // Move up one directory
    const parentPath = join(currentPath, '..');
    if (parentPath === currentPath) break; // Reached root
    currentPath = parentPath;
  }

  throw new Error('No buster.yml found');
}

/**
 * Resolve configuration hierarchy: CLI options > config file > defaults
 * Returns a fully resolved configuration object
 */
export function resolveConfiguration(
  config: BusterConfig,
  _options: DeployOptions,
  projectName?: string
): ResolvedConfig {
  // Select project to use
  const project = projectName
    ? config.projects.find((p) => p.name === projectName)
    : config.projects[0];

  if (!project) {
    throw new Error(
      projectName
        ? `Project '${projectName}' not found in buster.yml`
        : 'No projects defined in buster.yml'
    );
  }

  // Build resolved config from project
  const resolved: ResolvedConfig = {
    data_source_name: project.data_source,
    database: project.database,
    schema: project.schema,
    include: project.include,
    exclude: project.exclude,
  };

  // Validate resolved config
  const result = ResolvedConfigSchema.parse(resolved);
  return result;
}

/**
 * Get the base directory for a buster.yml file
 * Used for resolving relative paths in the config
 */
export function getConfigBaseDir(configPath: string): string {
  // If configPath is a directory, use it directly
  // Otherwise, use its parent directory
  if (existsSync(configPath) && require('node:fs').statSync(configPath).isDirectory()) {
    return resolve(configPath);
  }
  return resolve(join(configPath, '..'));
}

/**
 * Resolve model paths relative to config base directory
 */
export function resolveModelPaths(modelPaths: string[], baseDir: string): string[] {
  return modelPaths.map((path) => {
    // If path is absolute, use it directly
    if (path.startsWith('/')) {
      return path;
    }
    // Otherwise, resolve relative to base directory
    return resolve(baseDir, path);
  });
}
