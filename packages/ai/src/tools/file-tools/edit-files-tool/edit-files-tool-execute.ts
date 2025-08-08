import { updateMessageEntries } from '@buster/database';
import { runTypescript } from '@buster/sandbox';
import { wrapTraced } from 'braintrust';
import type {
  EditFilesToolContext,
  EditFilesToolInput,
  EditFilesToolOutput,
  EditFilesToolState,
} from './edit-files-tool';
import { createEditFilesToolTransformHelper } from './helpers/edit-files-tool-transform-helper';

export function createEditFilesToolExecute(
  state: EditFilesToolState,
  context: EditFilesToolContext
) {
  return wrapTraced(
    async (input: EditFilesToolInput): Promise<EditFilesToolOutput> => {
      const { edits } = input;

      if (!edits || edits.length === 0) {
        return {
          results: [],
          summary: { total: 0, successful: 0, failed: 0 },
        };
      }

      try {
        const sandbox = context.sandbox;

        if (!sandbox) {
          // When not in sandbox, we can't edit files - return error for each edit
          const output = {
            results: edits.map((edit) => ({
              status: 'error' as const,
              file_path: edit.filePath,
              error_message: 'File editing requires sandbox environment',
            })),
            summary: {
              total: edits.length,
              successful: 0,
              failed: edits.length,
            },
          };

          // Update database with error result
          if (state.entry_id) {
            const transformToDb = createEditFilesToolTransformHelper(context);
            const dbEntry = transformToDb({
              entry_id: state.entry_id,
              tool_name: 'edit_files',
              args: input,
              result: { error: 'File editing requires sandbox environment' },
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

        // Generate CommonJS code for sandbox execution
        const editsJson = JSON.stringify(edits);
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const editsJson = ${JSON.stringify(editsJson)};
const edits = JSON.parse(editsJson);
const results = [];

// Process edits
for (const edit of edits) {
  try {
    const resolvedPath = path.isAbsolute(edit.filePath) 
      ? edit.filePath 
      : path.join(process.cwd(), edit.filePath);
      
    // Read the file
    let content;
    try {
      content = fs.readFileSync(resolvedPath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        results.push({
          success: false,
          filePath: edit.filePath,
          error: 'File not found'
        });
        continue;
      }
      throw error;
    }
    
    // Check if find string exists
    const occurrences = content.split(edit.findString).length - 1;
    
    if (occurrences === 0) {
      results.push({
        success: false,
        filePath: edit.filePath,
        error: 'Find string not found in file: "' + edit.findString + '"'
      });
      continue;
    }
    
    if (occurrences > 1) {
      results.push({
        success: false,
        filePath: edit.filePath,
        error: 'Find string "' + edit.findString + '" appears ' + occurrences + ' times. Please use a more specific string that appears only once.'
      });
      continue;
    }
    
    // Replace the string
    const newContent = content.replace(edit.findString, edit.replaceString);
    fs.writeFileSync(resolvedPath, newContent, 'utf-8');
    
    results.push({
      success: true,
      filePath: edit.filePath,
      message: 'Successfully replaced "' + edit.findString + '" with "' + edit.replaceString + '" in ' + edit.filePath
    });
  } catch (error) {
    results.push({
      success: false,
      filePath: edit.filePath,
      error: (error instanceof Error ? error.message : String(error)) || 'Unknown error'
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

        const output = {
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

        // Store execution results in state
        state.executionResults = output.results;

        // Update database with successful result
        if (state.entry_id) {
          const transformToDb = createEditFilesToolTransformHelper(context);
          const dbEntry = transformToDb({
            entry_id: state.entry_id,
            tool_name: 'edit_files',
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
          results: edits.map((edit) => ({
            status: 'error' as const,
            file_path: edit.filePath,
            error_message: errorMessage,
          })),
          summary: {
            total: edits.length,
            successful: 0,
            failed: edits.length,
          },
        };

        // Update database with error result
        if (state.entry_id) {
          const transformToDb = createEditFilesToolTransformHelper(context);
          const dbEntry = transformToDb({
            entry_id: state.entry_id,
            tool_name: 'edit_files',
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
    { name: 'edit-files-tool-execute' }
  );
}
