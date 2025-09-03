import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import yaml from 'js-yaml';
import {
  type BusterConfig,
  BusterConfigSchema,
  type DeployOptions,
  type ProjectContext,
  type ResolvedConfig,
  ResolvedConfigSchema,
} from '../schemas';

/**
 * Recursively find all buster.yml files in a directory and its subdirectories
 */
async function findBusterYmlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip common directories that shouldn't be scanned
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === '.next' ||
          entry.name === 'coverage' ||
          entry.name === '.turbo'
        ) {
          continue;
        }
        // Recursively search subdirectory
        const subFiles = await findBusterYmlFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name === 'buster.yml' || entry.name === 'buster.yaml') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
    if (
      (error as NodeJS.ErrnoException).code !== 'EACCES' &&
      (error as NodeJS.ErrnoException).code !== 'EPERM'
    ) {
      console.warn(`Warning: Error reading directory ${dir}:`, error);
    }
  }

  return files;
}

/**
 * Load and parse a single buster.yml file
 */
async function loadSingleBusterConfig(configPath: string): Promise<BusterConfig | null> {
  try {
    const content = await readFile(configPath, 'utf-8');
    const rawConfig = yaml.load(content) as unknown;

    // Validate and parse with Zod schema
    const result = BusterConfigSchema.safeParse(rawConfig);

    if (result.success) {
      return result.data;
    }

    console.warn(`Warning: Invalid buster.yml at ${configPath}:`, result.error.issues);
    return null;
  } catch (error) {
    console.warn(`Warning: Failed to read ${configPath}:`, error);
    return null;
  }
}

/**
 * Check if two projects are duplicates (same name and data source)
 */
function areProjectsDuplicate(p1: ProjectContext, p2: ProjectContext): boolean {
  return (
    p1.name === p2.name &&
    p1.data_source === p2.data_source &&
    p1.database === p2.database &&
    p1.schema === p2.schema
  );
}

/**
 * Find and load all buster.yml configuration files recursively
 * Merges all found configurations and checks for duplicates
 * @throws Error if no buster.yml is found
 */
export async function loadBusterConfig(searchPath = '.'): Promise<BusterConfig> {
  const absolutePath = resolve(searchPath);

  // Check if the path exists
  if (!existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }

  // Check if it's a directory
  const pathStat = await stat(absolutePath);
  if (!pathStat.isDirectory()) {
    throw new Error(`Path is not a directory: ${absolutePath}`);
  }

  console.info(`🔍 Searching for buster.yml files in ${absolutePath}...`);

  // Find all buster.yml files recursively
  const configFiles = await findBusterYmlFiles(absolutePath);

  if (configFiles.length === 0) {
    throw new Error('No buster.yml found in the repository');
  }

  console.info(`📄 Found ${configFiles.length} buster.yml file(s):`);
  for (const file of configFiles) {
    console.info(`   - ${relative(absolutePath, file)}`);
  }

  // Load all configurations
  const allProjects: ProjectContext[] = [];
  const configSources = new Map<ProjectContext, string>();

  for (const configFile of configFiles) {
    const config = await loadSingleBusterConfig(configFile);
    if (config?.projects) {
      for (const project of config.projects) {
        // Check for duplicates
        const existingProject = allProjects.find((p) => areProjectsDuplicate(p, project));
        if (existingProject) {
          const existingSource = configSources.get(existingProject);
          console.warn(
            `⚠️  Warning: Duplicate project '${project.name}' found:
   First defined in: ${existingSource}
   Also defined in: ${relative(absolutePath, configFile)}
   Using the first definition.`
          );
          continue;
        }

        allProjects.push(project);
        configSources.set(project, relative(absolutePath, configFile));
      }
    }
  }

  if (allProjects.length === 0) {
    throw new Error('No valid projects found in any buster.yml files');
  }

  console.info(`✅ Found ${allProjects.length} unique project(s)`);

  // Return merged configuration
  return {
    projects: allProjects,
  };
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
