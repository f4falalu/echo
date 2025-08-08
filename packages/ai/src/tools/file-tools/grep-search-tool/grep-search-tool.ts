import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createGrepSearchToolDelta } from './grep-search-tool-delta';
import { createGrepSearchToolExecute } from './grep-search-tool-execute';
import { createGrepSearchToolFinish } from './grep-search-tool-finish';
import { createGrepSearchToolStart } from './grep-search-tool-start';

const GrepResultSchema = z.object({
  success: z.boolean().describe('Whether the command executed successfully'),
  command: z.string().describe('The command that was executed'),
  stdout: z.string().optional().describe('Standard output from the command'),
  stderr: z.string().optional().describe('Standard error from the command'),
  error: z.string().optional().describe('Error message if command failed'),
});

export const GrepSearchToolInputSchema = z.object({
  commands: z.array(z.string()).min(1).describe('Array of ripgrep (rg) commands to execute'),
});

const GrepSearchToolOutputSchema = z.object({
  message: z.string().describe('Summary message'),
  duration: z.number().describe('Duration of operation in milliseconds'),
  results: z.array(GrepResultSchema).describe('Results from each command'),
});

const GrepSearchToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'process' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .describe('Sandbox instance for command execution'),
});

const GrepSearchToolStateSchema = z.object({
  entry_id: z.string().optional().describe('The entry ID for database updates'),
  args: z.string().optional().describe('Accumulated streaming arguments'),
  commands: z.array(z.string()).optional().describe('Parsed commands from streaming input'),
});

export type GrepSearchToolInput = z.infer<typeof GrepSearchToolInputSchema>;
export type GrepSearchToolOutput = z.infer<typeof GrepSearchToolOutputSchema>;
export type GrepSearchToolContext = z.infer<typeof GrepSearchToolContextSchema>;
export type GrepSearchToolState = z.infer<typeof GrepSearchToolStateSchema>;

export function createGrepSearchTool<
  TAgentContext extends GrepSearchToolContext = GrepSearchToolContext,
>(context: TAgentContext) {
  const state: GrepSearchToolState = {
    entry_id: undefined,
    args: undefined,
    commands: undefined,
  };

  const execute = createGrepSearchToolExecute(state, context);
  const onInputStart = createGrepSearchToolStart(state, context);
  const onInputDelta = createGrepSearchToolDelta(state, context);
  const onInputAvailable = createGrepSearchToolFinish(state, context);

  return tool({
    description:
      'Executes ripgrep (rg) commands to search files and directories. Accepts raw rg commands with any flags and options. Returns the stdout/stderr output from each command.',
    inputSchema: GrepSearchToolInputSchema,
    outputSchema: GrepSearchToolOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
