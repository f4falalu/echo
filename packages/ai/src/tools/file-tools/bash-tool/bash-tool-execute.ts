import { $ } from 'bun';
import type { BashToolContext, BashToolInput, BashToolOutput } from './bash-tool';

const MAX_OUTPUT_LENGTH = 30_000;
const DEFAULT_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const MAX_TIMEOUT = 10 * 60 * 1000; // 10 minutes

/**
 * Creates a timeout promise that rejects after the specified time
 */
function createTimeoutPromise(timeout: number, command: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Command timed out after ${timeout}ms: ${command.length > 50 ? `${command.substring(0, 50)}...` : command}`
        )
      );
    }, timeout);
  });
}

/**
 * Executes a bash command using Bun's $ shell with timeout support
 * @param command - The bash command to execute
 * @param timeout - Timeout in milliseconds
 * @param projectDirectory - The project directory to execute the command in
 * @returns Result object with stdout, stderr, exitCode, and success status
 */
async function executeCommand(
  command: string,
  timeout: number,
  projectDirectory: string
): Promise<BashToolOutput> {
  try {
    // Execute command with timeout using Promise.race
    const proc = await Promise.race([
      $`${command}`.cwd(projectDirectory).nothrow().quiet(),
      createTimeoutPromise(timeout, command),
    ]);

    let stdout = proc.stdout?.toString() || '';
    let stderr = proc.stderr?.toString() || '';

    // Truncate output if it exceeds max length
    if (stdout.length > MAX_OUTPUT_LENGTH) {
      stdout = stdout.slice(0, MAX_OUTPUT_LENGTH);
      stdout += '\n\n(Output was truncated due to length limit)';
    }

    if (stderr.length > MAX_OUTPUT_LENGTH) {
      stderr = stderr.slice(0, MAX_OUTPUT_LENGTH);
      stderr += '\n\n(Error output was truncated due to length limit)';
    }

    const exitCode = proc.exitCode ?? 0;
    const success = exitCode === 0;

    const result: BashToolOutput = {
      command,
      stdout,
      stderr,
      exitCode,
      success,
    };

    // Only add error property if there is an error
    if (!success) {
      result.error = stderr || `Command failed with exit code ${exitCode}`;
    }

    return result;
  } catch (error) {
    // Check if it was a timeout
    if (error instanceof Error && error.message.includes('timed out')) {
      return {
        command,
        stdout: '',
        stderr: `Command timed out after ${timeout}ms`,
        exitCode: 124, // Standard timeout exit code
        success: false,
        error: `Command timed out after ${timeout}ms`,
      };
    }

    // Handle other execution errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      command,
      stdout: '',
      stderr: errorMessage,
      exitCode: 1,
      success: false,
      error: `Execution error: ${errorMessage}`,
    };
  }
}

/**
 * Creates the execute function for the bash tool
 * @param context - The tool context containing messageId and project directory
 * @returns The execute function
 */
export function createBashToolExecute(context: BashToolContext) {
  return async function execute(input: BashToolInput): Promise<BashToolOutput> {
    const { messageId, projectDirectory } = context;
    const { command, timeout } = input;

    console.info(`Executing bash command for message ${messageId}: ${command}`);

    const commandTimeout = Math.min(timeout ?? DEFAULT_TIMEOUT, MAX_TIMEOUT);
    const result = await executeCommand(command, commandTimeout, projectDirectory);

    // Log result
    if (result.success) {
      console.info(`Command succeeded: ${command}`);
    } else {
      console.error(`Command failed: ${command}`, result.error);
    }

    return result;
  };
}
