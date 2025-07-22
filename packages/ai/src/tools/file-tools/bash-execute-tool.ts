import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKey } from '../../context/docs-agent-context';

const bashCommandSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  description: z.string().optional().describe('Description of what this command does'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
});

const inputSchema = z.object({
  commands: z
    .union([bashCommandSchema, z.array(bashCommandSchema)])
    .describe('Single command or array of bash commands to execute'),
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
      const sandbox = runtimeContext.get(DocsAgentContextKey.Sandbox);

      if (sandbox) {
        const { generateBashExecuteCode } = await import('./bash-execute-functions');
        const code = generateBashExecuteCode(commands);
        const result = await runTypescript(sandbox, code);

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Stdout:', result.result);
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

      const { executeBashCommandsSafely } = await import('./bash-execute-functions');
      const bashResults = await executeBashCommandsSafely(commands);
      return { results: bashResults };
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

export const bashExecute = createTool({
  id: 'bash_execute',
  description: 'Executes bash commands and captures stdout, stderr, and exit codes',
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
