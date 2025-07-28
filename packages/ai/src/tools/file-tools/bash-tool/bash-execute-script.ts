import * as child_process from 'node:child_process';

interface BashCommandParams {
  command: string;
  description?: string;
  timeout?: number;
}

interface BashExecuteResult {
  command: string;
  stdout: string;
  stderr?: string | undefined;
  exitCode: number;
  success: boolean;
  error?: string | undefined;
}

function executeSingleBashCommand(
  command: string,
  timeout?: number
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve, reject) => {
    const child = child_process.spawn('bash', ['-c', command], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timeoutId: NodeJS.Timeout | undefined;

    if (timeout) {
      timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);
    }

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0,
      });
    });

    child.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject(error);
    });
  });
}

async function executeBashCommandsSafely(
  commands: BashCommandParams[]
): Promise<BashExecuteResult[]> {
  const results: BashExecuteResult[] = [];

  for (const cmd of commands) {
    try {
      const result = await executeSingleBashCommand(cmd.command, cmd.timeout);

      results.push({
        command: cmd.command,
        stdout: result.stdout,
        stderr: result.stderr ? result.stderr : undefined,
        exitCode: result.exitCode,
        success: result.exitCode === 0,
        error: result.exitCode !== 0 ? result.stderr || 'Command failed' : undefined,
      });
    } catch (error) {
      results.push({
        command: cmd.command,
        stdout: '',
        stderr: undefined,
        exitCode: 1,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
      });
    }
  }

  return results;
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      JSON.stringify({
        success: false,
        error: 'No commands provided. Expected JSON string as argument.',
      })
    );
    process.exit(1);
  }

  try {
    // Parse commands from JSON argument
    const firstArg = args[0];
    if (!firstArg) {
      throw new Error('No argument provided');
    }
    const commands: BashCommandParams[] = JSON.parse(firstArg);

    if (!Array.isArray(commands)) {
      throw new Error('Commands must be an array');
    }

    // Execute commands
    const results = await executeBashCommandsSafely(commands);

    // Output as JSON to stdout
    console.log(JSON.stringify(results));
  } catch (error) {
    console.error(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    );
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error(
    JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
    })
  );
  process.exit(1);
});
