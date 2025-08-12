import type { Sandbox } from '@buster/sandbox';
import { z } from 'zod';
import { DocsAgentContextSchema } from '../../../agents/docs-agent/docs-agent-context';
import { getRepositoryTree } from './helpers/tree-helper';

// Zod schemas first - following Zod-first approach
export const getRepositoryTreeParamsSchema = z.object({
  message: z.string().describe('The user message'),
  organizationId: z.string().describe('The organization ID'),
  contextInitialized: z.boolean().describe('Whether context was initialized'),
  context: DocsAgentContextSchema.describe('The docs agent context'),
});

export const getRepositoryTreeResultSchema = z.object({
  message: z.string().describe('The user message'),
  organizationId: z.string().describe('The organization ID'),
  contextInitialized: z.boolean().describe('Whether context was initialized'),
  context: DocsAgentContextSchema.describe('The docs agent context'),
  repositoryTree: z.string().describe('The tree structure of the repository'),
});

// Export types from schemas
export type GetRepositoryTreeParams = z.infer<typeof getRepositoryTreeParamsSchema>;
export type GetRepositoryTreeResult = z.infer<typeof getRepositoryTreeResultSchema>;

/**
 * Generates a tree structure of the repository using the sandbox
 */
export async function runGetRepositoryTreeStep(
  params: GetRepositoryTreeParams
): Promise<GetRepositoryTreeResult> {
  try {
    // Validate input
    const validatedParams = getRepositoryTreeParamsSchema.parse(params);

    // Get the sandbox from context
    const sandbox = validatedParams.context.sandbox as Sandbox;

    if (!sandbox) {
      console.warn('[GetRepositoryTree] No sandbox available, skipping tree generation');
      return {
        ...validatedParams,
        repositoryTree: '',
      };
    }

    console.info('[GetRepositoryTree] Generating repository tree structure');

    // Get current working directory
    const pwdResult = await sandbox.process.executeCommand('pwd');
    const currentDir = pwdResult.result.trim();

    // Get the tree structure with gitignore option enabled
    const treeResult = await getRepositoryTree(sandbox, '.', {
      gitignore: true,
      maxDepth: 5, // Limit depth to avoid extremely large outputs
    });

    if (!treeResult.success || !treeResult.output) {
      console.warn('[GetRepositoryTree] Failed to generate tree:', treeResult.error);
      return {
        ...validatedParams,
        repositoryTree: '',
      };
    }

    // Prepend current directory info to tree output
    const treeWithLocation = `<YOU ARE HERE: ${currentDir}>\n\n${treeResult.output}`;

    console.info('[GetRepositoryTree] Tree structure generated successfully', {
      outputLength: treeResult.output.length,
      command: treeResult.command,
      currentDirectory: currentDir,
    });

    // Return the data with the tree structure added
    return {
      ...validatedParams,
      repositoryTree: treeWithLocation,
    };
  } catch (error) {
    console.error('[GetRepositoryTree] Error generating repository tree:', error);
    // Don't fail the entire workflow if tree generation fails
    return {
      ...params,
      repositoryTree: '',
    };
  }
}
