import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';

const bashCommandSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  description: z.string().optional().describe('Description of what this command does'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
});

const inputSchema = z.object({
  commands: z.array(bashCommandSchema),
});

const outputSchema = z.object({
  results: z.array(
    z.object({
      command: z.string(),
      stdout: z.string(),
      stderr: z.string().optional(),
      exitCode: z.number(),
      success: z.boolean(),
      error: z.string().optional(),
    })
  ),
});

const executeBashCommands = wrapTraced(
  async (
    input: z.infer<typeof inputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof outputSchema>> => {
    const commands = Array.isArray(input.commands) ? input.commands : [input.commands];

    if (!commands || commands.length === 0) {
      return { results: [] };
    }

    try {
      // Check if sandbox is available in runtime context
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        // Generate CommonJS code for sandbox execution
        const commandsJson = JSON.stringify(commands);
        const sandboxCode = `
const { spawn } = require('child_process');

const commandsJson = ${JSON.stringify(commandsJson)};
const commands: any[] = JSON.parse(commandsJson);
const results: any[] = [];

function executeSingleCommand(command: string, timeout?: number) {
  return new Promise((resolve: any) => {
    const child = spawn('bash', ['-c', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout: string = '';
    let stderr: string = '';
    let timeoutId: any;
    
    if (timeout) {
      timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: -1,
          timedOut: true
        });
      }, timeout);
    }
    
    child.stdout.on('data', (data: any) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data: any) => {
      stderr += data.toString();
    });
    
    child.on('close', (code: number | null) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0,
        timedOut: false
      });
    });
    
    child.on('error', (error: any) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: -1,
        error: error.message,
        timedOut: false
      });
    });
  });
}

async function executeCommands() {
  for (const cmd of commands) {
    const result: any = await executeSingleCommand(cmd.command, cmd.timeout);
    
    if (result.timedOut) {
      results.push({
        command: cmd.command,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        success: false,
        error: 'Command timed out after ' + cmd.timeout + 'ms'
      });
    } else if (result.error) {
      results.push({
        command: cmd.command,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        success: false,
        error: result.error
      });
    } else {
      results.push({
        command: cmd.command,
        stdout: result.stdout,
        stderr: result.stderr || undefined,
        exitCode: result.exitCode,
        success: result.exitCode === 0,
        error: result.exitCode !== 0 ? result.stderr || 'Command failed' : undefined
      });
    }
  }
  
  console.log(JSON.stringify(results));
}

executeCommands();
`;

        const result = await runTypescript(sandbox, sandboxCode);

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Result:', result.result);

          // Try to parse error response from script
          try {
            const errorResponse = JSON.parse(result.result || result.stderr || '{}');
            if (errorResponse.success === false && errorResponse.error) {
              throw new Error(errorResponse.error);
            }
          } catch {
            // If parsing fails or it's not the expected error format, use generic error
          }

          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        let bashResults: Array<{
          command: string;
          stdout: string;
          stderr?: string;
          exitCode: number;
          success: boolean;
          error?: string;
        }>;
        try {
          bashResults = JSON.parse(result.result.trim());
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          throw new Error(
            `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          );
        }

        return { results: bashResults };
      }

      // When not in sandbox, we can't execute bash commands
      // Return an error for each command
      return {
        results: commands.map((cmd) => ({
          command: cmd.command,
          stdout: '',
          stderr: undefined,
          exitCode: 1,
          success: false,
          error: 'Bash execution requires sandbox environment',
        })),
      };
    } catch (error) {
      return {
        results: commands.map((cmd) => ({
          command: cmd.command,
          stdout: '',
          stderr: undefined,
          exitCode: 1,
          success: false,
          error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'bash-execute-tool' }
);

export const executeBash = createTool({
  id: 'execute-bash',
  description: `Executes bash commands and captures stdout, stderr, and exit codes.

IMPORTANT: The 'commands' field must be an array of command objects: [{command: "pwd", description: "Print working directory"}, {command: "ls", description: "List files"}]`,
  inputSchema,
  outputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof inputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await executeBashCommands(context, runtimeContext);
  },
});

export default executeBash;
