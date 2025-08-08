import { wrapTraced } from 'braintrust';
import type {
  GrepSearchToolContext,
  GrepSearchToolInput,
  GrepSearchToolOutput,
  GrepSearchToolState,
} from './grep-search-tool';

// Process grep search execution in sandbox
async function processGrepSearch(
  input: GrepSearchToolInput,
  context: GrepSearchToolContext
): Promise<GrepSearchToolOutput> {
  const { commands } = input;
  const startTime = Date.now();

  if (!commands || commands.length === 0) {
    return {
      message: 'No commands provided',
      duration: Date.now() - startTime,
      results: [],
    };
  }

  try {
    const sandbox = context.sandbox;

    if (sandbox) {
      // Execute all commands concurrently
      const resultPromises = commands.map(async (command) => {
        try {
          // Use executeCommand like bash-tool does
          const result = await sandbox.process.executeCommand(command);

          // The sandbox returns the full output in result.result
          const output = (result.result || '').trim();

          // For ripgrep, exit code 1 means no matches found, which is not an error
          const isRgNoMatchesFound = result.exitCode === 1 && command.includes('rg ');

          if (result.exitCode === 0 || isRgNoMatchesFound) {
            return {
              success: true,
              command: command,
              stdout: output,
              stderr: '',
            };
          }
          return {
            success: false,
            command: command,
            stdout: '',
            stderr: output,
            error: `Command failed with exit code ${result.exitCode}`,
          };
        } catch (error) {
          return {
            success: false,
            command: command,
            error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      });

      const rgResults = await Promise.all(resultPromises);

      return {
        message: `Executed ${rgResults.length} ripgrep commands`,
        duration: Date.now() - startTime,
        results: rgResults,
      };
    }

    // When not in sandbox, we can't use the rg command
    // Return an error for each command
    return {
      message: 'Ripgrep commands require sandbox environment',
      duration: Date.now() - startTime,
      results: commands.map((cmd) => ({
        success: false,
        command: cmd,
        error: 'ripgrep command requires sandbox environment',
      })),
    };
  } catch (error) {
    return {
      message: 'Execution error occurred',
      duration: Date.now() - startTime,
      results: commands.map((cmd) => ({
        success: false,
        command: cmd,
        error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })),
    };
  }
}

// Factory function that creates the execute function with proper context typing
export function createGrepSearchToolExecute(
  _grepSearchToolState: GrepSearchToolState,
  context: GrepSearchToolContext
) {
  return wrapTraced(
    async (input: GrepSearchToolInput): Promise<GrepSearchToolOutput> => {
      return processGrepSearch(input, context);
    },
    { name: 'Grep Search Tool' }
  );
}
