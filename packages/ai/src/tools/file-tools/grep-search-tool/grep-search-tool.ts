import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { DocsAgentOptions } from '../../../agents/docs-agent/docs-agent';

const rgSearchInputSchema = z.object({
  commands: z.array(z.string()).min(1).describe('Array of ripgrep (rg) commands to execute'),
});

const rgResultSchema = z.object({
  success: z.boolean().describe('Whether the command executed successfully'),
  command: z.string().describe('The command that was executed'),
  stdout: z.string().optional().describe('Standard output from the command'),
  stderr: z.string().optional().describe('Standard error from the command'),
  error: z.string().optional().describe('Error message if command failed'),
});

const rgSearchOutputSchema = z.object({
  message: z.string().describe('Summary message'),
  duration: z.number().describe('Duration of operation in milliseconds'),
  results: z.array(rgResultSchema).describe('Results from each command'),
});

export type RgSearchInput = z.infer<typeof rgSearchInputSchema>;
export type RgSearchOutput = z.infer<typeof rgSearchOutputSchema>;

const grepSearchContextSchema = z.object({
  sandbox: z.custom<Sandbox>(
    (val) => {
      return val && typeof val === 'object' && 'id' in val && 'process' in val;
    },
    { message: 'Invalid Sandbox instance' }
  ),
});

type GrepSearchContext = z.infer<typeof grepSearchContextSchema>;

const rgSearchExecution = wrapTraced(
  async (
    params: z.infer<typeof rgSearchInputSchema>,
    context: GrepSearchContext
  ): Promise<z.infer<typeof rgSearchOutputSchema>> => {
    const { commands } = params;
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
  },
  { name: 'rg-search' }
);

export const grepSearch = tool({
  description:
    'Executes ripgrep (rg) commands to search files and directories. Accepts raw rg commands with any flags and options. Returns the stdout/stderr output from each command.',
  inputSchema: rgSearchInputSchema,
  outputSchema: rgSearchOutputSchema,
  execute: async (input, { experimental_context: context }) => {
    const rawContext = context as DocsAgentOptions & { sandbox?: Sandbox };
    
    // Check if sandbox is available
    if (!rawContext?.sandbox) {
      // Return error for each command when sandbox is not available
      const startTime = Date.now();
      return {
        message: 'Ripgrep commands require sandbox environment',
        duration: Date.now() - startTime,
        results: input.commands.map((cmd) => ({
          success: false,
          command: cmd,
          error: 'ripgrep command requires sandbox environment',
        })),
      };
    }
    
    const grepSearchContext = grepSearchContextSchema.parse({
      sandbox: rawContext.sandbox,
    });
    
    return await rgSearchExecution(input, grepSearchContext);
  },
});

export default grepSearch;
