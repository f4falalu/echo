import { updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { createListFilesToolTransformHelper } from './helpers/list-files-tool-transform-helper';
import type {
  ListFilesToolContext,
  ListFilesToolInput,
  ListFilesToolOutput,
  ListFilesToolState,
} from './list-files-tool';

export function createListFilesToolExecute(
  state: ListFilesToolState,
  context: ListFilesToolContext
) {
  return wrapTraced(
    async (input: ListFilesToolInput): Promise<ListFilesToolOutput> => {
      const { paths, options } = input;

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
              error_message: 'tree command requires sandbox environment',
            })),
          };
        }

        const results = [];

        for (const targetPath of paths) {
          try {
            const flags = ['--gitignore'];

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

            const command = `tree ${flags.join(' ')} "${targetPath}"`;
            const result = await sandbox.process.executeCommand(command);

            if (result.exitCode === 0) {
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

        const output = { results };

        if (state.entry_id) {
          const transformToDb = createListFilesToolTransformHelper(context);
          const dbEntry = transformToDb({
            entry_id: state.entry_id,
            tool_name: 'list_files',
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
          const transformToDb = createListFilesToolTransformHelper(context);
          const dbEntry = transformToDb({
            entry_id: state.entry_id,
            tool_name: 'list_files',
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
    { name: 'list-files-tool-execute' }
  );
}
