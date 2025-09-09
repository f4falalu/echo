import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import type { deploy } from '@buster/server-shared';
import { glob } from 'fast-glob';

type DeployDoc = deploy.DeployDoc;

/**
 * Discover markdown documentation files based on include patterns
 * @param includePatterns - The include patterns from buster.yml
 * @param baseDir - The directory where buster.yml is located
 */
export async function discoverDocFiles(
  includePatterns: string[],
  baseDir: string
): Promise<string[]> {
  // Use the same patterns as model discovery
  const patterns = includePatterns.map((pattern) => {
    // If pattern is absolute, use it directly
    if (pattern.startsWith('/')) {
      return pattern;
    }
    // Otherwise, resolve relative to the buster.yml directory
    return `${baseDir}/${pattern}`;
  });

  // Find all files matching the patterns
  const files = await glob(patterns, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
    absolute: true,
    unique: true,
    cwd: baseDir,
  });

  // Filter to only .md files
  const mdFiles = files.filter((file) => {
    const ext = file.toLowerCase();
    return ext.endsWith('.md');
  });

  return mdFiles.sort(); // Sort for consistent ordering
}

/**
 * Read and prepare markdown files for deployment
 * @param files - Absolute paths to markdown files
 * @param baseDir - The directory where buster.yml is located
 */
export async function prepareDocsForDeployment(
  files: string[],
  baseDir: string
): Promise<DeployDoc[]> {
  const docs: DeployDoc[] = [];

  for (const file of files) {
    try {
      // Read file content
      const content = await readFile(file, 'utf-8');

      // Use relative path from buster.yml as the doc name
      const name = relative(baseDir, file);

      // Check if this is an ANALYST.md file (case-insensitive)
      const fileName = name.split('/').pop()?.toUpperCase();
      const docType = fileName === 'ANALYST.MD' ? 'analyst' : 'normal';

      docs.push({
        name,
        content,
        type: docType,
      });
    } catch (error) {
      console.warn(`Failed to read doc file ${file}:`, error);
      // Continue processing other files
    }
  }

  return docs;
}

/**
 * Discover and prepare all markdown documentation for deployment
 */
export async function discoverAndPrepareDocs(
  includePatterns: string[],
  baseDir: string
): Promise<{
  docs: DeployDoc[];
  fileCount: number;
}> {
  const files = await discoverDocFiles(includePatterns, baseDir);
  const docs = await prepareDocsForDeployment(files, baseDir);

  return {
    docs,
    fileCount: files.length,
  };
}
