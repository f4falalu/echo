import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type SandboxContext, SandboxContextKey } from '../../../context/sandbox-context';
import type { AnalystRuntimeContext } from '../../../schemas/workflow-schemas';

const fileCreateParamsSchema = z.object({
  path: z.string().describe('The relative or absolute path to create the file at'),
  content: z.string().describe('The content to write to the file'),
});

const createFilesInputSchema = z.object({
  files: z
    .array(fileCreateParamsSchema)
    .describe('Array of file creation operations to perform'),
});

const createFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        filePath: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        filePath: z.string(),
        errorMessage: z.string(),
      }),
    ])
  ),
});

const createFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof createFilesInputSchema>,
    runtimeContext: RuntimeContext<SandboxContext>
  ): Promise<z.infer<typeof createFilesOutputSchema>> => {
    const { files } = params;

    if (!files || files.length === 0) {
      return { results: [] };
    }

    try {
      // Check if sandbox is available in runtime context
      const sandbox = runtimeContext.get(SandboxContextKey.Sandbox);

      if (sandbox) {
        // Execute in sandbox
        const { generateFileCreateCode } = await import('./create-file-functions');
        const code = generateFileCreateCode(files);
        const result = await runTypescript(sandbox, code);

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Stdout:', result.result);
          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        // Parse the JSON output from sandbox
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

        return {
          results: fileResults.map((fileResult) => {
            if (fileResult.success) {
              return {
                status: 'success' as const,
                filePath: fileResult.filePath,
              };
            }
            return {
              status: 'error' as const,
              filePath: fileResult.filePath,
              errorMessage: fileResult.error || 'Unknown error',
            };
          }),
        };
      }

      // Fallback to local execution
      const { createFilesSafely } = await import('./create-file-functions');
      const fileResults = await createFilesSafely(files);

      return {
        results: fileResults.map((fileResult) => {
          if (fileResult.success) {
            return {
              status: 'success' as const,
              filePath: fileResult.filePath,
            };
          }
          return {
            status: 'error' as const,
            filePath: fileResult.filePath,
            errorMessage: fileResult.error || 'Unknown error',
          };
        }),
      };
    } catch (error) {
      return {
        results: files.map((file) => ({
          status: 'error' as const,
          filePath: file.path,
          errorMessage: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'create-files' }
);

export const createFiles = createTool({
  id: 'create-files',
  description: `Create one or more files at specified paths with provided content. Supports both absolute and relative file paths. Creates directories if they don't exist and overwrites existing files. Handles errors gracefully by continuing to process other files even if some fail. Returns both successful operations and failed operations with detailed error messages.`,
  inputSchema: createFilesInputSchema,
  outputSchema: createFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof createFilesInputSchema>;
    runtimeContext: RuntimeContext<SandboxContext>;
  }) => {
    return await createFilesExecution(context, runtimeContext);
  },
});

export default createFiles;
