import { updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
import type {
  DeleteFilesToolContext,
  DeleteFilesToolInput,
  DeleteFilesToolOutput,
  DeleteFilesToolState,
} from './delete-files-tool';
import { createDeleteFilesToolTransformHelper } from './helpers/delete-files-tool-transform-helper';

export function createDeleteFilesToolExecute(
  state: DeleteFilesToolState,
  context: DeleteFilesToolContext
) {
  return wrapTraced(
    async (input: DeleteFilesToolInput): Promise<DeleteFilesToolOutput> => {
      const { paths } = input;

      if (!paths || paths.length === 0) {
        return { results: [] };
      }

      try {
        const sandbox = context.sandbox;

        if (!sandbox) {
          return {
            results: paths.map((targetPath) => ({
              status: 'error' as const,
              path: targetPath,
              error_message: 'File deletion requires sandbox environment',
            })),
          };
        }

        const results = [];

        // Process each file path
        for (const filePath of paths) {
          try {
            // First check if it's a directory
            const testResult = await sandbox.process.codeRun(`
              const fs = require('fs');
              
              try {
                const stats = fs.statSync('${filePath.replace(/'/g, "\\'")}');
                process.stdout.write(JSON.stringify({ isDirectory: stats.isDirectory() }));
              } catch (error) {
                process.stdout.write(JSON.stringify({ error: error.code || error.message }));
                process.exit(1);
              }
            `);

            if (testResult.exitCode === 0) {
              let testData: { isDirectory?: boolean; error?: string };
              try {
                testData = JSON.parse(testResult.result.trim());
              } catch (parseError) {
                results.push({
                  status: 'error' as const,
                  path: filePath,
                  error_message: `Failed to parse directory check result: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
                });
                continue;
              }

              if (testData.isDirectory) {
                results.push({
                  status: 'error' as const,
                  path: filePath,
                  error_message: 'Cannot delete directories with this tool',
                });
                continue;
              }
            }

            // Use rm command to delete the file
            const deleteResult = await sandbox.process.codeRun(`
              const { execSync } = require('child_process');
              
              try {
                execSync('rm "${filePath.replace(/"/g, '\\"')}"', { encoding: 'utf8' });
                process.stdout.write('SUCCESS');
              } catch (error) {
                process.stderr.write('ERROR: ' + error.message);
                process.exit(1);
              }
            `);

            if (deleteResult.exitCode === 0) {
              results.push({
                status: 'success' as const,
                path: filePath,
              });
            } else {
              const errorMessage = deleteResult.result || 'Unknown error';
              results.push({
                status: 'error' as const,
                path: filePath,
                error_message: errorMessage.includes('No such file')
                  ? 'File not found'
                  : errorMessage,
              });
            }
          } catch (error) {
            results.push({
              status: 'error' as const,
              path: filePath,
              error_message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        const output = { results };

        if (state.entry_id) {
          const transformToDb = createDeleteFilesToolTransformHelper(context);
          const dbEntry = transformToDb({
            entry_id: state.entry_id,
            tool_name: 'delete_files',
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
          results: paths.map((targetPath) => ({
            status: 'error' as const,
            path: targetPath,
            error_message: errorMessage,
          })),
        };

        if (state.entry_id) {
          const transformToDb = createDeleteFilesToolTransformHelper(context);
          const dbEntry = transformToDb({
            entry_id: state.entry_id,
            tool_name: 'delete_files',
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
    { name: 'delete-files-tool-execute' }
  );
}
