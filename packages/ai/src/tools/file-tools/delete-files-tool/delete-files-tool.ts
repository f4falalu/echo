import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';

const deleteFilesInputSchema = z.object({
  paths: z
    .array(z.string())
    .describe(
      'Array of file paths to delete. Can be absolute paths (e.g., /path/to/file.txt) or relative paths (e.g., ./relative/file.txt). Only files can be deleted, not directories.'
    ),
});

const deleteFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        path: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

const deleteFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof deleteFilesInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof deleteFilesOutputSchema>> => {
    const { paths } = params;

    if (!paths || paths.length === 0) {
      return { results: [] };
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        // Generate CommonJS code for sandbox execution
        const pathsJson = JSON.stringify(paths);
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const pathsJson = ${JSON.stringify(pathsJson)};
const paths = JSON.parse(pathsJson);
const results = [];

// Process paths
for (const filePath of paths) {
  try {
    const resolvedPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
      
    // Check if it's a directory
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      results.push({
        success: false,
        path: filePath,
        error: 'Cannot delete directories with this tool'
      });
      continue;
    }
    
    // Delete the file
    fs.unlinkSync(resolvedPath);
    
    results.push({
      success: true,
      path: filePath
    });
  } catch (error) {
    results.push({
      success: false,
      path: filePath,
      error: (error as any).code === 'ENOENT' ? 'File not found' : (error instanceof Error ? error.message : String(error))
    });
  }
}

console.log(JSON.stringify(results));
`;

        const result = await runTypescript(sandbox, sandboxCode);

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Result:', result.result);
          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        let deleteResults: Array<{
          success: boolean;
          path: string;
          error?: string;
        }>;
        try {
          deleteResults = JSON.parse(result.result.trim());
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          throw new Error(
            `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          );
        }

        return {
          results: deleteResults.map((deleteResult) => {
            if (deleteResult.success) {
              return {
                status: 'success' as const,
                path: deleteResult.path,
              };
            }
            return {
              status: 'error' as const,
              path: deleteResult.path,
              error_message: deleteResult.error || 'Unknown error',
            };
          }),
        };
      }

      // When not in sandbox, we can't delete files
      // Return an error for each path
      return {
        results: paths.map((targetPath) => ({
          status: 'error' as const,
          path: targetPath,
          error_message: 'File deletion requires sandbox environment',
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
  { name: 'delete-files' }
);

export const deleteFiles = createTool({
  id: 'delete-files',
  description: `Deletes files at the specified paths. Accepts both absolute and relative file paths and can handle bulk operations through an array of paths. Only files can be deleted, not directories. Returns structured JSON with deletion results including success status and any error messages. Handles errors gracefully by continuing to process other files even if some fail.`,
  inputSchema: deleteFilesInputSchema,
  outputSchema: deleteFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof deleteFilesInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await deleteFilesExecution(context, runtimeContext);
  },
});

export default deleteFiles;
