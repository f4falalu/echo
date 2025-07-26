import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';
import type { LsOptions } from './ls-files-impl';

const lsOptionsSchema = z.object({
  detailed: z
    .boolean()
    .optional()
    .describe(
      'Use -l flag for detailed listing with permissions, owner, size, and modification date'
    ),
  all: z
    .boolean()
    .optional()
    .describe('Use -a flag to include hidden files and directories (those starting with .)'),
  recursive: z.boolean().optional().describe('Use -R flag for recursive listing of subdirectories'),
  humanReadable: z
    .boolean()
    .optional()
    .describe('Use -h flag for human-readable file sizes (e.g., 1K, 234M, 2G)'),
});

const lsFilesInputSchema = z.object({
  paths: z
    .array(z.string())
    .describe(
      'Array of paths to list. Can be absolute paths (e.g., /path/to/directory) or relative paths (e.g., ./relative/path). Directories will be listed with their contents.'
    ),
  options: lsOptionsSchema.optional().describe('Options for ls command execution'),
});

const lsFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        path: z.string(),
        entries: z.array(
          z.object({
            name: z.string(),
            type: z.enum(['file', 'directory', 'symlink', 'other']),
            size: z.string().optional(),
            permissions: z.string().optional(),
            modified: z.string().optional(),
            owner: z.string().optional(),
            group: z.string().optional(),
          })
        ),
      }),
      z.object({
        status: z.literal('error'),
        path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

const lsFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof lsFilesInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof lsFilesOutputSchema>> => {
    const { paths, options } = params;

    if (!paths || paths.length === 0) {
      return { results: [] };
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        const { generateLsCode } = await import('./ls-files-impl');
        const code = generateLsCode(paths, options as LsOptions);
        const result = await runTypescript(sandbox, code);

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Stdout:', result.result);
          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        let lsResults: Array<{
          success: boolean;
          path: string;
          entries?: Array<{
            name: string;
            type: string;
            size?: string;
            permissions?: string;
            modified?: string;
            owner?: string;
            group?: string;
          }>;
          error?: string;
        }>;
        try {
          lsResults = JSON.parse(result.result.trim());
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          throw new Error(
            `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          );
        }

        return {
          results: lsResults.map((lsResult) => {
            if (lsResult.success) {
              return {
                status: 'success' as const,
                path: lsResult.path,
                entries: (lsResult.entries || []).map((entry) => ({
                  name: entry.name,
                  type: entry.type as 'file' | 'directory' | 'symlink' | 'other',
                  size: entry.size,
                  permissions: entry.permissions,
                  modified: entry.modified,
                  owner: entry.owner,
                  group: entry.group,
                })),
              };
            }
            return {
              status: 'error' as const,
              path: lsResult.path,
              error_message: lsResult.error || 'Unknown error',
            };
          }),
        };
      }

      const { lsFilesSafely } = await import('./ls-files-impl');
      const lsResults = await lsFilesSafely(paths, options as LsOptions);

      return {
        results: lsResults.map((lsResult) => {
          if (lsResult.success) {
            return {
              status: 'success' as const,
              path: lsResult.path,
              entries: (lsResult.entries || []).map((entry) => ({
                name: entry.name,
                type: entry.type,
                size: entry.size,
                permissions: entry.permissions,
                modified: entry.modified,
                owner: entry.owner,
                group: entry.group,
              })),
            };
          }
          return {
            status: 'error' as const,
            path: lsResult.path,
            error_message: lsResult.error || 'Unknown error',
          };
        }),
      };
    } catch (error) {
      return {
        results: paths.map((path) => ({
          status: 'error' as const,
          path,
          error_message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'ls-files' }
);

export const lsFiles = createTool({
  id: 'ls-files',
  description: `Lists files and directories with structured metadata output using the ls command. Supports standard ls options like -l (detailed listing), -a (include hidden files), -R (recursive), and -h (human-readable sizes). Accepts both absolute and relative paths and can handle bulk operations through an array of paths. Returns structured JSON with file metadata including name, type, size, permissions, and modification dates. Handles errors gracefully by continuing to process other paths even if some fail.`,
  inputSchema: lsFilesInputSchema,
  outputSchema: lsFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof lsFilesInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await lsFilesExecution(context, runtimeContext);
  },
});

export default lsFiles;
