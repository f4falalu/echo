import { spawn } from 'node:child_process';

export interface BashCommandParams {
  command: string;
  description?: string | undefined;
  timeout?: number | undefined;
}

export interface BashExecuteResult {
  command: string;
  stdout: string;
  stderr?: string | undefined;
  exitCode: number;
  success: boolean;
  error?: string | undefined;
}

async function executeSingleBashCommand(
  command: string,
  timeout?: number
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', ['-c', command], {
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

export async function executeBashCommandsSafely(
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

export function generateBashExecuteCode(commands: BashCommandParams[]): string {
  return `
const { spawnSync } = require('child_process');

function executeSingleBashCommand(command, timeout) {
  try {
    const options = {
      shell: '/bin/bash',
      encoding: 'utf8',
      timeout: timeout || undefined,
    };

    const result = spawnSync('bash', ['-c', command], options);
    
    return {
      command,
      stdout: result.stdout ? result.stdout.trim() : '',
      stderr: result.stderr ? result.stderr.trim() : undefined,
      exitCode: result.status !== null ? result.status : 1,
      success: result.status === 0,
      error: result.status !== 0 ? (result.stderr ? result.stderr.trim() : 'Command failed') : undefined,
    };
  } catch (error) {
    return {
      command,
      stdout: '',
      stderr: undefined,
      exitCode: 1,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown execution error',
    };
  }
}

function executeBashCommandsConcurrently(commands) {
  return commands.map((cmd) => executeSingleBashCommand(cmd.command, cmd.timeout));
}

const commands = ${JSON.stringify(commands)};
const results = executeBashCommandsConcurrently(commands);
console.log(JSON.stringify(results));
  `.trim();
}
