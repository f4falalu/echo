import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTypescript } from '@buster/sandbox';
import type { Sandbox } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import {
  type DocsAgentContext,
  DocsAgentContextKeys,
} from '../../../agents/docs-agent/docs-agent-context';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TreeOptions {
  gitignore?: boolean;
  maxDepth?: number;
  dirsOnly?: boolean;
  pattern?: string;
}

export interface TreeResult {
  success: boolean;
  output?: string;
  error?: string;
  command?: string;
}

/**
 * Generates a tree structure of the repository using the tree command.
 * This function must be run in a sandbox context.
 *
 * @param sandbox - The Daytona sandbox instance
 * @param targetPath - The path to generate tree from (defaults to repository root)
 * @param options - Options for the tree command
 * @returns The tree output as a string, or error information
 */
export async function getRepositoryTree(
  sandbox: Sandbox,
  targetPath = '.',
  options: TreeOptions = { gitignore: true }
): Promise<TreeResult> {
  try {
    // Read the tree script
    const scriptPath = path.join(__dirname, 'tree-script.ts');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');

    // Prepare arguments - base64 encode to avoid shell escaping issues
    const argsObject = {
      path: targetPath,
      options,
    };
    const args = [Buffer.from(JSON.stringify(argsObject)).toString('base64')];

    // Execute in sandbox
    const result = await runTypescript(sandbox, scriptContent, { argv: args });

    if (result.exitCode !== 0) {
      // Try to parse error response from script
      try {
        const errorResponse = JSON.parse(result.result || result.stderr || '{}');
        if (errorResponse.success === false) {
          return errorResponse;
        }
      } catch {
        // If parsing fails, use generic error
      }

      return {
        success: false,
        error: `Sandbox execution failed: ${result.stderr || 'Unknown error'}`,
      };
    }

    // Parse the result
    try {
      const treeResult: TreeResult = JSON.parse(result.result.trim());
      return treeResult;
    } catch (parseError) {
      return {
        success: false,
        error: `Failed to parse tree output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Helper function to get repository tree from runtime context.
 * This checks if a sandbox is available and uses it to execute the tree command.
 *
 * @param runtimeContext - The runtime context that may contain a sandbox
 * @param targetPath - The path to generate tree from (defaults to repository root)
 * @param options - Options for the tree command
 * @returns The tree output as a string, or null if no sandbox is available
 */
export async function getRepositoryTreeFromContext(
  runtimeContext: RuntimeContext<DocsAgentContext>,
  targetPath = '.',
  options: TreeOptions = { gitignore: true }
): Promise<TreeResult | null> {
  const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

  if (!sandbox) {
    return null;
  }

  return getRepositoryTree(sandbox, targetPath, options);
}
