import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';
import type { AnalystRuntimeContext } from '../../../schemas/workflow-schemas';

const readFilesInputSchema = z.object({
  files: z
    .array(z.string())
    .describe(
      'Array of file paths to read. Can be absolute paths (e.g., /path/to/file.txt) or relative paths (e.g., ./relative/path/file.ts). Files will be read with UTF-8 encoding.'
    ),
});

const readFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        file_path: z.string(),
        content: z.string(),
        truncated: z
          .boolean()
          .describe('Whether the file content was truncated due to exceeding 1000 lines'),
      }),
      z.object({
        status: z.literal('error'),
        file_path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

const readFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof readFilesInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof readFilesOutputSchema>> => {
    const { files } = params;

    if (!files || files.length === 0) {
      return { results: [] };
    }

    try {
      // Check if sandbox is available in runtime context
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        // Execute in sandbox
        const { generateFileReadCode } = await import('./read-files');
        const code = generateFileReadCode(files);
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
          content?: string;
          truncated?: boolean;
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
                file_path: fileResult.filePath,
                content: fileResult.content || '',
                truncated: fileResult.truncated || false,
              };
            }
            return {
              status: 'error' as const,
              file_path: fileResult.filePath,
              error_message: fileResult.error || 'Unknown error',
            };
          }),
        };
      }
      // Fallback to local execution
      const { readFilesSafely } = await import('./read-files');
      const fileResults = await readFilesSafely(files);

      return {
        results: fileResults.map((fileResult) => {
          if (fileResult.success) {
            return {
              status: 'success' as const,
              file_path: fileResult.filePath,
              content: fileResult.content || '',
              truncated: fileResult.truncated || false,
            };
          }
          return {
            status: 'error' as const,
            file_path: fileResult.filePath,
            error_message: fileResult.error || 'Unknown error',
          };
        }),
      };
    } catch (error) {
      return {
        results: files.map((filePath) => ({
          status: 'error' as const,
          file_path: filePath,
          error_message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'read-files' }
);

export const readFiles = createTool({
  id: 'read-files',
  description: `Read the contents of one or more files from the filesystem. Accepts both absolute and relative file paths. Files are read with UTF-8 encoding and content is limited to 1000 lines maximum. Returns both successful reads and failures with detailed error messages.`,
  inputSchema: readFilesInputSchema,
  outputSchema: readFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof readFilesInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await readFilesExecution(context, runtimeContext);
  },
});

export default readFiles;
