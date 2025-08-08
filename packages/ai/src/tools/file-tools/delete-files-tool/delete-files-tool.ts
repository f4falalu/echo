import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createDeleteFilesToolDelta } from './delete-files-tool-delta';
import { createDeleteFilesToolExecute } from './delete-files-tool-execute';
import { createDeleteFilesToolFinish } from './delete-files-tool-finish';
import { createDeleteFilesToolStart } from './delete-files-tool-start';

export const DeleteFilesToolInputSchema = z.object({
  paths: z
    .array(z.string())
    .describe(
      'Array of file paths to delete. Can be absolute paths (e.g., /path/to/file.txt) or relative paths (e.g., ./relative/file.txt). Only files can be deleted, not directories.'
    ),
});

const DeleteFilesToolOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        path: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

const DeleteFilesToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'process' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .describe('Sandbox instance for file operations'),
});

const DeleteFilesToolStateSchema = z.object({
  entry_id: z.string().optional().describe('The entry ID for database updates'),
  args: z.string().optional().describe('Accumulated streaming arguments'),
  paths: z.array(z.string()).optional().describe('Parsed paths from streaming input'),
});

export type DeleteFilesToolInput = z.infer<typeof DeleteFilesToolInputSchema>;
export type DeleteFilesToolOutput = z.infer<typeof DeleteFilesToolOutputSchema>;
export type DeleteFilesToolContext = z.infer<typeof DeleteFilesToolContextSchema>;
export type DeleteFilesToolState = z.infer<typeof DeleteFilesToolStateSchema>;

export function createDeleteFilesTool<
  TAgentContext extends DeleteFilesToolContext = DeleteFilesToolContext,
>(context: TAgentContext) {
  const state: DeleteFilesToolState = {
    entry_id: undefined,
    args: undefined,
    paths: undefined,
  };

  const execute = createDeleteFilesToolExecute(state, context);
  const onInputStart = createDeleteFilesToolStart(state, context);
  const onInputDelta = createDeleteFilesToolDelta(state, context);
  const onInputAvailable = createDeleteFilesToolFinish(state, context);

  return tool({
    description: `Deletes files at the specified paths. Accepts both absolute and relative file paths and can handle bulk operations through an array of paths. Only files can be deleted, not directories. Returns structured JSON with deletion results including success status and any error messages. Handles errors gracefully by continuing to process other files even if some fail.`,
    inputSchema: DeleteFilesToolInputSchema,
    outputSchema: DeleteFilesToolOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
