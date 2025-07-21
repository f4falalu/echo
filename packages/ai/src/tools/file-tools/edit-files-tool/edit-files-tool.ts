import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type SandboxContext, SandboxContextKey } from '../../../context/sandbox-context';

const editFileParamsSchema = z.object({
  filePath: z.string().describe('Relative or absolute path to the file'),
  findString: z.string().describe('Text to find (must appear exactly once)'),
  replaceString: z.string().describe('Text to replace the found text with'),
});

const editFilesInputSchema = z.object({
  edits: z
    .array(editFileParamsSchema)
    .min(1, 'At least one edit must be provided')
    .max(100, 'Maximum 100 edits allowed per request')
    .describe(
      'Array of edit operations to perform. Each edit specifies a file path, text to find, and replacement text. The find string must appear exactly once in the file.'
    ),
});

const editFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        file_path: z.string(),
        message: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        file_path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
  summary: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
  }),
});

const editFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof editFilesInputSchema>,
    runtimeContext: RuntimeContext<SandboxContext>
  ): Promise<z.infer<typeof editFilesOutputSchema>> => {
    const { edits } = params;

    if (!edits || edits.length === 0) {
      return {
        results: [],
        summary: { total: 0, successful: 0, failed: 0 },
      };
    }

    try {
      const sandbox = runtimeContext.get(SandboxContextKey.Sandbox);

      if (sandbox) {
        const { generateFileEditCode } = await import('./edit-files');
        const code = generateFileEditCode(edits);
        const result = await runTypescript(sandbox, code);

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed:', result.stderr);
          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        let fileResults: Array<{
          success: boolean;
          filePath: string;
          message?: string;
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

        const successful = fileResults.filter((r) => r.success).length;
        const failed = fileResults.length - successful;

        return {
          results: fileResults.map((fileResult) => {
            if (fileResult.success) {
              return {
                status: 'success' as const,
                file_path: fileResult.filePath,
                message: fileResult.message || 'File edited successfully',
              };
            }
            return {
              status: 'error' as const,
              file_path: fileResult.filePath,
              error_message: fileResult.error || 'Unknown error',
            };
          }),
          summary: {
            total: fileResults.length,
            successful,
            failed,
          },
        };
      }

      const { editFilesSafely } = await import('./edit-files');
      const fileResults = await editFilesSafely(edits);

      const successful = fileResults.filter((r) => r.success).length;
      const failed = fileResults.length - successful;

      return {
        results: fileResults.map((fileResult) => {
          if (fileResult.success) {
            return {
              status: 'success' as const,
              file_path: fileResult.filePath,
              message: fileResult.message || 'File edited successfully',
            };
          }
          return {
            status: 'error' as const,
            file_path: fileResult.filePath,
            error_message: fileResult.error || 'Unknown error',
          };
        }),
        summary: {
          total: fileResults.length,
          successful,
          failed,
        },
      };
    } catch (error) {
      return {
        results: edits.map((edit) => ({
          status: 'error' as const,
          file_path: edit.filePath,
          error_message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
        summary: {
          total: edits.length,
          successful: 0,
          failed: edits.length,
        },
      };
    }
  },
  { name: 'edit-files' }
);

export const editFiles = createTool({
  id: 'edit-files',
  description: `Performs find-and-replace operations on files with validation and bulk editing support. Replaces specified text content with new content, but only if the find string appears exactly once in the file. Supports both relative and absolute file paths and can handle bulk operations through an array of edit objects.

Key features:
- Validates that the find string appears exactly once (returns error if 0 or multiple occurrences)
- Supports both relative and absolute file paths
- Handles bulk operations with individual success/failure tracking
- Continues processing remaining edits when errors occur
- Returns detailed error messages for various failure scenarios

Error conditions:
- File doesn't exist: Returns error indicating file not found
- Find string not found: Returns error indicating no match
- Find string found multiple times: Returns error suggesting a more specific string
- Permission/IO errors: Returns appropriate error messages

For bulk operations, each edit is processed independently and the tool returns both successful and failed operations with detailed results.`,
  inputSchema: editFilesInputSchema,
  outputSchema: editFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof editFilesInputSchema>;
    runtimeContext: RuntimeContext<SandboxContext>;
  }) => {
    return await editFilesExecution(context, runtimeContext);
  },
});

export default editFiles;
