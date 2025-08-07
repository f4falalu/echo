import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { DocsAgentOptions } from '../../../agents/docs-agent/docs-agent';

const bashCommandSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  description: z.string().optional().describe('Description of what this command does'),
  timeout: z
    .number()
    .optional()
    .describe('Timeout in milliseconds (currently not supported in sandbox)'),
});

const inputSchema = z.object({
  commands: z.array(bashCommandSchema),
});

const bashExecuteContextSchema = z.object({
  sandbox: z.custom<Sandbox>(
    (val) => {
      return val && typeof val === 'object' && 'id' in val && 'process' in val;
    },
    { message: 'Invalid Sandbox instance' }
  ),
});

type BashExecuteContext = z.infer<typeof bashExecuteContextSchema>;

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
    context: BashExecuteContext
  ): Promise<z.infer<typeof outputSchema>> => {
    const commands = Array.isArray(input.commands) ? input.commands : [input.commands];

    if (!commands || commands.length === 0) {
      return { results: [] };
    }

    try {
      const sandbox = context.sandbox;

      if (sandbox) {
        // Execute all commands concurrently using executeCommand
        const resultPromises = commands.map(async (cmd) => {
          try {
            const result = await sandbox.process.executeCommand(cmd.command);

            // The sandbox returns the full output in result.result
            // For bash commands, we want to capture everything and trim whitespace
            const output = (result.result || '').trim();

            // For timeout handling, we'll need to implement a different approach
            // The sandbox doesn't support the timeout command directly
            // TODO: Implement timeout handling if needed

            return {
              command: cmd.command,
              stdout: output,
              stderr: '', // Sandbox combines stdout/stderr in result
              exitCode: result.exitCode,
              success: result.exitCode === 0,
              error:
                result.exitCode !== 0
                  ? output || `Command failed with exit code ${result.exitCode}`
                  : undefined,
            };
          } catch (error) {
            return {
              command: cmd.command,
              stdout: '',
              stderr: '',
              exitCode: 1,
              success: false,
              error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
          }
        });

        const results = await Promise.all(resultPromises);
        return { results };
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

export const bashExecute = tool({
  description: `Executes bash commands and captures stdout, stderr, and exit codes.

IMPORTANT: The 'commands' field must be an array of command objects: [{command: "pwd", description: "Print working directory"}, {command: "ls", description: "List files"}]

Note: Timeout functionality is currently not supported in the sandbox environment.`,
  inputSchema,
  outputSchema,
  execute: async (input, { experimental_context: context }) => {
    const rawContext = context as DocsAgentOptions & { sandbox?: Sandbox };
    
    // Check if sandbox is available
    if (!rawContext?.sandbox) {
      // Return error for each command when sandbox is not available
      return {
        results: input.commands.map((cmd) => ({
          command: cmd.command,
          stdout: '',
          stderr: undefined,
          exitCode: 1,
          success: false,
          error: 'Bash execution requires sandbox environment',
        })),
      };
    }
    
    const bashExecuteContext = bashExecuteContextSchema.parse({
      sandbox: rawContext.sandbox,
    });
    
    return await executeBashCommands(input, bashExecuteContext);
  },
});

// Keep the old export name for compatibility
export const executeBash = bashExecute;

export default bashExecute;
