import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';

const rgCommandSchema = z.object({
  command: z.string().describe('The full ripgrep (rg) command to execute'),
});

const rgSearchInputSchema = z.object({
  commands: z.array(rgCommandSchema).min(1).describe('Array of ripgrep commands to execute'),
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

const rgSearchExecution = wrapTraced(
  async (
    params: z.infer<typeof rgSearchInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
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
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        // Read the grep-search-script.ts content
        const scriptPath = path.join(__dirname, 'grep-search-script.ts');
        const scriptContent = await fs.readFile(scriptPath, 'utf-8');

        // Build command line arguments
        // Base64 encode the JSON to avoid corruption when passing through sandbox
        const commandsJson = JSON.stringify(commands);
        const base64Commands = Buffer.from(commandsJson).toString('base64');
        const args = [base64Commands];

        const result = await runTypescript(sandbox, scriptContent, { argv: args });

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Result:', result.result);
          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        let rgResults: Array<{
          success: boolean;
          command: string;
          stdout?: string;
          stderr?: string;
          error?: string;
        }>;
        try {
          rgResults = JSON.parse(result.result.trim());
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          throw new Error(
            `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          );
        }

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
          command: cmd.command,
          error: 'ripgrep command requires sandbox environment',
        })),
      };
    } catch (error) {
      return {
        message: 'Execution error occurred',
        duration: Date.now() - startTime,
        results: commands.map((cmd) => ({
          success: false,
          command: cmd.command,
          error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'rg-search' }
);

export const grepSearch = createTool({
  id: 'grep_search',
  description:
    'Executes ripgrep (rg) commands to search files and directories. Accepts raw rg commands with any flags and options. Returns the stdout/stderr output from each command.',
  inputSchema: rgSearchInputSchema,
  outputSchema: rgSearchOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof rgSearchInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await rgSearchExecution(context, runtimeContext);
  },
});

export default grepSearch;
