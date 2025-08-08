import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createBashToolDelta } from './bash-tool-delta';
import { createBashToolExecute } from './bash-tool-execute';
import { createBashToolFinish } from './bash-tool-finish';
import { createBashToolStart } from './bash-tool-start';

const BashCommandSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  description: z.string().optional().describe('Description of what this command does'),
  timeout: z
    .number()
    .optional()
    .describe('Timeout in milliseconds (currently not supported in sandbox)'),
});

export const BashToolInputSchema = z.object({
  commands: z.array(BashCommandSchema).describe('Array of bash command objects to execute'),
});

export const BashToolOutputSchema = z.object({
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

const BashToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'process' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .describe('Sandbox instance for bash command execution'),
});

const BashToolStateSchema = z.object({
  toolCallId: z.string().optional().describe('The tool call ID'),
  args: z.string().optional().describe('Accumulated streaming arguments'),
  commands: z.array(BashCommandSchema).optional().describe('Parsed commands from streaming input'),
  isComplete: z.boolean().optional().describe('Whether input is complete'),
  startTime: z.number().optional().describe('Execution start time'),
  executionTime: z.number().optional().describe('Total execution time in ms'),
  executionResults: z
    .array(
      z.object({
        command: z.string(),
        stdout: z.string(),
        stderr: z.string().optional(),
        exitCode: z.number(),
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .optional()
    .describe('Execution results'),
});

export type BashToolInput = z.infer<typeof BashToolInputSchema>;
export type BashToolOutput = z.infer<typeof BashToolOutputSchema>;
export type BashToolContext = z.infer<typeof BashToolContextSchema>;
export type BashToolState = z.infer<typeof BashToolStateSchema>;

// Factory function to create the bash tool
export function createBashTool<TAgentContext extends BashToolContext = BashToolContext>(
  context: TAgentContext
) {
  // Initialize state for streaming
  const state: BashToolState = {
    toolCallId: undefined,
    args: '',
    commands: [],
    isComplete: false,
    startTime: undefined,
    executionTime: undefined,
    executionResults: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createBashToolExecute(state, context);
  const onInputStart = createBashToolStart(state, context);
  const onInputDelta = createBashToolDelta(state, context);
  const onInputAvailable = createBashToolFinish(state, context);

  return tool({
    description: `Executes bash commands and captures stdout, stderr, and exit codes.

IMPORTANT: The 'commands' field must be an array of command objects: [{command: "pwd", description: "Print working directory"}, {command: "ls", description: "List files"}]

Note: Timeout functionality is currently not supported in the sandbox environment.`,
    inputSchema: BashToolInputSchema,
    outputSchema: BashToolOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
