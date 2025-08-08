import { updateMessageEntries } from '@buster/database';
import { runTypescript } from '@buster/sandbox';
import { wrapTraced } from 'braintrust';
import { createReadFilesToolTransformHelper } from './helpers/read-files-tool-transform-helper';
import type {
  ReadFilesToolContext,
  ReadFilesToolInput,
  ReadFilesToolOutput,
  ReadFilesToolState,
} from './read-files-tool';

export function createReadFilesToolExecute(
  state: ReadFilesToolState,
  context: ReadFilesToolContext
) {
  return wrapTraced(
    async (input: ReadFilesToolInput): Promise<ReadFilesToolOutput> => {
      const { files } = input;

      if (!files || files.length === 0) {
        return { results: [] };
      }

      try {
        const sandbox = context.sandbox;

        if (!sandbox) {
          return {
            results: files.map((filePath) => ({
              status: 'error' as const,
              file_path: filePath,
              error_message: 'File reading requires sandbox environment',
            })),
          };
        }

        // Generate CommonJS code for sandbox execution
        const filesJson = JSON.stringify(files);
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const filesJson = ${JSON.stringify(filesJson)};
const files = JSON.parse(filesJson);
const results = [];
const MAX_LINES = 1000;

// Process files
for (const filePath of files) {
  try {
    const resolvedPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
      
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const lines = content.split('\\n');
    const truncated = lines.length > MAX_LINES;
    const truncatedContent = truncated 
      ? lines.slice(0, MAX_LINES).join('\\n')
      : content;
    
    results.push({
      success: true,
      filePath: filePath,
      content: truncatedContent,
      truncated: truncated
    });
  } catch (error) {
    results.push({
      success: false,
      filePath: filePath,
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

        const output: ReadFilesToolOutput = {
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

        if (state.entry_id) {
          const transformToDb = createReadFilesToolTransformHelper(context);
          const dbEntry = transformToDb({
            entry_id: state.entry_id,
            tool_name: 'read_files',
            args: input,
            result: output,
            status: 'success',
            started_at: new Date(),
            completed_at: new Date(),
          });

          await updateMessageEntries({
            messageId: context.messageId,
            entries: [dbEntry],
          });
        }

        return output;
      } catch (error) {
        const errorMessage = `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        const output = {
          results: files.map((filePath) => ({
            status: 'error' as const,
            file_path: filePath,
            error_message: errorMessage,
          })),
        };

        if (state.entry_id) {
          const transformToDb = createReadFilesToolTransformHelper(context);
          const dbEntry = transformToDb({
            entry_id: state.entry_id,
            tool_name: 'read_files',
            args: input,
            result: { error: errorMessage },
            status: 'error',
            started_at: new Date(),
            completed_at: new Date(),
          });

          await updateMessageEntries({
            messageId: context.messageId,
            entries: [dbEntry],
          });
        }

        return output;
      }
    },
    { name: 'read-files-tool-execute' }
  );
}
