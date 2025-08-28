import { relative, resolve } from 'node:path';
import { glob } from 'fast-glob';
import micromatch from 'micromatch';
import type { DeploymentExcluded, ResolvedConfig } from '../schemas';

/**
 * Discover YAML model files based on configuration
 * Uses fast-glob for efficient file discovery
 */
export async function discoverModelFiles(
  config: ResolvedConfig,
  baseDir: string,
  recursive = true
): Promise<string[]> {
  const patterns: string[] = [];

  // Build glob patterns from model paths
  const modelPaths = [...config.model_paths, ...config.semantic_model_paths];

  for (const modelPath of modelPaths) {
    const absolutePath = resolve(baseDir, modelPath);

    if (recursive) {
      // Recursive search for YAML files
      patterns.push(`${absolutePath}/**/*.{yml,yaml}`);
    } else {
      // Non-recursive search
      patterns.push(`${absolutePath}/*.{yml,yaml}`);
    }
  }

  // Find all YAML files matching the patterns
  const files = await glob(patterns, {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/buster.yml', // Don't include the config file itself
      '**/buster.yaml',
    ],
    absolute: true,
    unique: true,
  });

  return files.sort(); // Sort for consistent ordering
}

/**
 * Filter model files based on exclusion patterns
 * Returns both included files and excluded files with reasons
 */
export async function filterModelFiles(
  files: string[],
  excludePatterns: string[],
  baseDir: string
): Promise<{
  included: string[];
  excluded: DeploymentExcluded[];
}> {
  const included: string[] = [];
  const excluded: DeploymentExcluded[] = [];

  if (excludePatterns.length === 0) {
    return { included: files, excluded: [] };
  }

  for (const file of files) {
    // Get relative path for pattern matching
    const relativePath = relative(baseDir, file);

    // Check if file matches any exclusion pattern
    const matchedPattern = findMatchingPattern(relativePath, excludePatterns);

    if (matchedPattern) {
      excluded.push({
        file: relativePath,
        reason: `Matched exclusion pattern: ${matchedPattern}`,
      });
    } else {
      included.push(file);
    }
  }

  return { included, excluded };
}

/**
 * Find the first exclusion pattern that matches a file path
 */
function findMatchingPattern(filePath: string, patterns: string[]): string | null {
  for (const pattern of patterns) {
    if (micromatch.isMatch(filePath, pattern)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Count total models that will be processed
 * Useful for progress tracking
 */
export async function countModelsInFiles(files: string[]): Promise<number> {
  // This is a simple estimate - assumes 1 model per file
  // The actual parsing will determine the real count
  return files.length;
}
