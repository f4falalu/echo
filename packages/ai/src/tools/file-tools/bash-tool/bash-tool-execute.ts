import type { BashToolContext, BashToolInput, BashToolOutput } from './bash-tool';

const MAX_OUTPUT_LENGTH = 30_000;
const DEFAULT_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const MAX_TIMEOUT = 10 * 60 * 1000; // 10 minutes

/**
 * Executes a bash command using Bun.spawn with timeout support
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
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Execute command using Bun.spawn
    // Use full path to bash for reliability
    const proc = Bun.spawn(['/bin/bash', '-c', command], {
      cwd: projectDirectory,
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });

    let stdout = '';
    let stderr = '';

    try {
      // Read stdout and stderr
      const [stdoutText, stderrText] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);

      stdout = stdoutText;
      stderr = stderrText;

      // Wait for process to exit
      const exitCode = await proc.exited;
      clearTimeout(timeoutId);

      // Truncate output if it exceeds max length
      if (stdout.length > MAX_OUTPUT_LENGTH) {
        stdout = stdout.slice(0, MAX_OUTPUT_LENGTH);
        stdout += '\n\n(Output was truncated due to length limit)';
      }

      if (stderr.length > MAX_OUTPUT_LENGTH) {
        stderr = stderr.slice(0, MAX_OUTPUT_LENGTH);
        stderr += '\n\n(Error output was truncated due to length limit)';
      }

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
    } catch (readError) {
      clearTimeout(timeoutId);
      proc.kill();

      // Check if it was aborted (timeout)
      if (controller.signal.aborted) {
        return {
          command,
          stdout: '',
          stderr: `Command timed out after ${timeout}ms`,
          exitCode: 124, // Standard timeout exit code
          success: false,
          error: `Command timed out after ${timeout}ms`,
        };
      }

      throw readError;
    }
  } catch (error) {
    // Handle execution errors
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
    const { messageId, projectDirectory, onToolEvent } = context;
    const { command, timeout } = input;

    console.info(`Executing bash command for message ${messageId}: ${command}`);

    // Emit start event
    onToolEvent?.({
      tool: 'bashTool',
      event: 'start',
      args: input,
    });

    const commandTimeout = Math.min(timeout ?? DEFAULT_TIMEOUT, MAX_TIMEOUT);
    const result = await executeCommand(command, commandTimeout, projectDirectory);

    // Log result
    if (result.success) {
      console.info(`Command succeeded: ${command}`);
    } else {
      console.error(`Command failed: ${command}`, result.error);
    }

    // Emit complete event
    onToolEvent?.({
      tool: 'bashTool',
      event: 'complete',
      result,
      args: input,
    });

    return result;
  };
}
