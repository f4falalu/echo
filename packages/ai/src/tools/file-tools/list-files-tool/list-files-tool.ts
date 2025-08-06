import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import {
  type DocsAgentContext,
  DocsAgentContextKeys,
} from '../../../agents/docs-agent/docs-agent-context';

const listFilesOptionsSchema = z.object({
  depth: z
    .number()
    .optional()
    .describe('Limit directory depth with -L flag (e.g., 2 for two levels deep)'),
  all: z.boolean().optional().describe('Use -a flag to include hidden files and directories'),
  dirsOnly: z.boolean().optional().describe('Use -d flag to show only directories'),
  ignorePattern: z
    .string()
    .optional()
    .describe('Use -I flag with pattern to exclude files/dirs (e.g., "node_modules|*.log")'),
  followSymlinks: z.boolean().optional().describe('Use -l flag to follow symbolic links'),
});

const listFilesInputSchema = z.object({
  paths: z
    .array(z.string())
    .describe(
      'Array of paths to display tree structure for. Can be absolute paths (e.g., /path/to/directory) or relative paths (e.g., ./relative/path).'
    ),
  options: listFilesOptionsSchema.optional().describe('Options for tree command execution'),
});

const listFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        path: z.string(),
        output: z.string().describe('Raw output from tree command'),
        currentDirectory: z
          .string()
          .optional()
          .describe('The current working directory when the tree was generated'),
      }),
      z.object({
        status: z.literal('error'),
        path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

const listFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof listFilesInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof listFilesOutputSchema>> => {
    const { paths, options } = params;

    if (!paths || paths.length === 0) {
      return { results: [] };
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        const results = [];

        for (const targetPath of paths) {
          try {
            // Build tree command flags
            const flags = ['--gitignore']; // Always include gitignore

            if (options?.depth) {
              flags.push('-L', options.depth.toString());
            }
            if (options?.all) {
              flags.push('-a');
            }
            if (options?.dirsOnly) {
              flags.push('-d');
            }
            if (options?.followSymlinks) {
              flags.push('-l');
            }
            if (options?.ignorePattern) {
              flags.push('-I', options.ignorePattern);
            }

            // Build tree command
            const command = `tree ${flags.join(' ')} "${targetPath}"`;

            // Execute command directly using sandbox.process.executeCommand
            const result = await sandbox.process.executeCommand(command);

            if (result.exitCode === 0) {
              // Get current directory
              const pwdResult = await sandbox.process.executeCommand('pwd');

              results.push({
                status: 'success' as const,
                path: targetPath,
                output: result.result,
                currentDirectory: pwdResult.result.trim(),
              });
            } else {
              results.push({
                status: 'error' as const,
                path: targetPath,
                error_message: result.result || `Command failed with exit code ${result.exitCode}`,
              });
            }
          } catch (error) {
            results.push({
              status: 'error' as const,
              path: targetPath,
              error_message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        return { results };
      }

      // When not in sandbox, we can't use the tree command
      // Return an error for each path
      return {
        results: paths.map((targetPath) => ({
          status: 'error' as const,
          path: targetPath,
          error_message: 'tree command requires sandbox environment',
        })),
      };
    } catch (error) {
      return {
        results: paths.map((targetPath) => ({
          status: 'error' as const,
          path: targetPath,
          error_message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'list-files' }
);

export const listFiles = createTool({
  id: 'list-files',
  description: `Displays the directory structure in a hierarchical tree format. Automatically excludes git-ignored files. Supports various options like depth limiting, showing only directories, following symlinks, and custom ignore patterns. Returns the raw text output showing the file system hierarchy with visual tree branches that clearly show parent-child relationships. Accepts both absolute and relative paths and can handle bulk operations through an array of paths.`,
  inputSchema: listFilesInputSchema,
  outputSchema: listFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof listFilesInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await listFilesExecution(context, runtimeContext);
  },
});

export default listFiles;
