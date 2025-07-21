import { createTool } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { spawn } from 'node:child_process';

const bashCommandSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  description: z.string().optional().describe('Description of what this command does'),
  timeout: z.number().optional().describe('Timeout in milliseconds')
});

const inputSchema = z.object({
  commands: z.union([
    bashCommandSchema,
    z.array(bashCommandSchema)
  ]).describe('Single command or array of bash commands to execute')
});

const outputSchema = z.object({
  results: z.array(z.object({
    command: z.string(),
    stdout: z.string(),
    stderr: z.string().optional(),
    exitCode: z.number(),
    success: z.boolean(),
    error: z.string().optional()
  }))
});

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
      stdio: ['pipe', 'pipe', 'pipe']
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
        exitCode: code || 0
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

const executeBashCommands = wrapTraced(
  async (
    input: z.infer<typeof inputSchema>,
    runtimeContext?: RuntimeContext
  ): Promise<z.infer<typeof outputSchema>> => {
    const commands = Array.isArray(input.commands) ? input.commands : [input.commands];
    const results = [];

    for (const cmd of commands) {
      try {
        const result = await executeSingleBashCommand(cmd.command, cmd.timeout);
        
        results.push({
          command: cmd.command,
          stdout: result.stdout,
          stderr: result.stderr || undefined,
          exitCode: result.exitCode,
          success: result.exitCode === 0,
          error: result.exitCode !== 0 ? result.stderr || 'Command failed' : undefined
        });
      } catch (error) {
        results.push({
          command: cmd.command,
          stdout: '',
          stderr: undefined,
          exitCode: 1,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown execution error'
        });
      }
    }

    return { results };
  },
  { name: 'bash-execute-tool' }
);

export const bashExecute = createTool({
  id: 'bash_execute',
  description: 'Executes bash commands and captures stdout, stderr, and exit codes',
  inputSchema,
  outputSchema,
  execute: async ({ context, runtimeContext }) => {
    return await executeBashCommands(context, runtimeContext);
  }
});
