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
 */
export async function loadBusterConfig(searchPath = '.'): Promise<BusterConfig | null> {
  const absolutePath = resolve(searchPath);
  let currentPath = absolutePath;

  // Search for buster.yml in current and parent directories
  while (currentPath !== '/') {
    const configPath = join(currentPath, 'buster.yml');

    if (existsSync(configPath)) {
      try {
        const content = await readFile(configPath, 'utf-8');
        const rawConfig = yaml.load(content) as unknown;

        // Validate and parse with Zod schema
        const result = BusterConfigSchema.safeParse(rawConfig);

        if (result.success) {
          console.info(`✅ Loaded buster.yml from: ${configPath}`);
          return result.data;
        } else {
          console.warn(`⚠️  Invalid buster.yml at ${configPath}:`, result.error.issues);
          return null;
        }
      } catch (error) {
        console.error(`❌ Error reading buster.yml at ${configPath}:`, error);
        return null;
      }
    }

    // Move up one directory
    const parentPath = join(currentPath, '..');
    if (parentPath === currentPath) break; // Reached root
    currentPath = parentPath;
  }

  console.info('ℹ️  No buster.yml found, using defaults');
  return null;
}

/**
 * Resolve configuration hierarchy: CLI options > config file > defaults
 * Returns a fully resolved configuration object
 */
export function resolveConfiguration(
  config: BusterConfig | null,
  options: DeployOptions
): ResolvedConfig {
  // Start with defaults
  const resolved: ResolvedConfig = {
    data_source_name: undefined,
    database: undefined,
    schema: undefined,
    model_paths: ['.'],
    semantic_model_paths: ['.'],
    exclude_files: [],
    exclude_tags: [],
  };

  // Apply config file settings
  if (config) {
    if (config.data_source_name) resolved.data_source_name = config.data_source_name;
    if (config.database) resolved.database = config.database;
    if (config.schema) resolved.schema = config.schema;
    if (config.model_paths?.length) resolved.model_paths = config.model_paths;
    if (config.semantic_model_paths?.length)
      resolved.semantic_model_paths = config.semantic_model_paths;
    if (config.exclude_files?.length) resolved.exclude_files = config.exclude_files;
    if (config.exclude_tags?.length) resolved.exclude_tags = config.exclude_tags;
  }

  // Apply CLI options (highest precedence)
  if (options.dataSource) resolved.data_source_name = options.dataSource;
  if (options.database) resolved.database = options.database;
  if (options.schema) resolved.schema = options.schema;

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
  if (existsSync(configPath) && require('fs').statSync(configPath).isDirectory()) {
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
