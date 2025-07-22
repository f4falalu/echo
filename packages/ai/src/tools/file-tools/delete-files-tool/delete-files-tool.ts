import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type SandboxContext, SandboxContextKey } from '../../../context/sandbox-context';

const deleteFilesInputSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string().describe('File path to delete (absolute or relative)'),
      })
    )
    .describe('Array of file deletion operations to perform'),
});

const deleteFilesOutputSchema = z.object({
  successes: z.array(z.string()),
  failures: z.array(
    z.object({
      path: z.string(),
      error: z.string(),
    })
  ),
});

const deleteFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof deleteFilesInputSchema>,
    runtimeContext: RuntimeContext<SandboxContext>
  ): Promise<z.infer<typeof deleteFilesOutputSchema>> => {
    const { files } = params;

    if (!files || files.length === 0) {
      return { successes: [], failures: [] };
    }

    try {
      const sandbox = runtimeContext.get(SandboxContextKey.Sandbox);

      if (sandbox) {
        const { generateFileDeleteCode } = await import('./delete-files-functions');
        const code = generateFileDeleteCode(files);
        const result = await runTypescript(sandbox, code);

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Stdout:', result.result);
          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        let fileResults: Array<{
          success: boolean;
          filePath: string;
          error?: string;
        }>;
        try {
          fileResults = JSON.parse(result.result.trim());
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          throw new Error(
            `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          );
        }

        const successes: string[] = [];
        const failures: Array<{ path: string; error: string }> = [];

        for (const fileResult of fileResults) {
          if (fileResult.success) {
            successes.push(fileResult.filePath);
          } else {
            failures.push({
              path: fileResult.filePath,
              error: fileResult.error || 'Unknown error',
            });
          }
        }

        return { successes, failures };
      }

      const { deleteFilesSafely } = await import('./delete-files-functions');
      const fileResults = await deleteFilesSafely(files);

      const successes: string[] = [];
      const failures: Array<{ path: string; error: string }> = [];

      for (const fileResult of fileResults) {
        if (fileResult.success) {
          successes.push(fileResult.filePath);
        } else {
          failures.push({
            path: fileResult.filePath,
            error: fileResult.error || 'Unknown error',
          });
        }
      }

      return { successes, failures };
    } catch (error) {
      return {
        successes: [],
        failures: files.map((file) => ({
          path: file.path,
          error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'delete-files' }
);

export const deleteFiles = createTool({
  id: 'delete_files',
  description: `Deletes files at the specified paths. Supports both absolute and relative file paths. Handles errors gracefully by continuing to process other files even if some fail. Returns both successful deletions and failed operations with detailed error messages. Does not fail the entire operation when individual file deletions fail.`,
  inputSchema: deleteFilesInputSchema,
  outputSchema: deleteFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof deleteFilesInputSchema>;
    runtimeContext: RuntimeContext<SandboxContext>;
  }) => {
    return await deleteFilesExecution(context, runtimeContext);
  },
});

export default deleteFiles;
