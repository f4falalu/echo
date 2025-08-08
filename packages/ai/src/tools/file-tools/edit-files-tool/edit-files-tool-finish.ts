import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { EditFilesToolInputSchema } from './edit-files-tool';
import type { EditFilesToolContext, EditFilesToolState } from './edit-files-tool';
import { createEditFilesToolTransformHelper } from './helpers/edit-files-tool-transform-helper';

export function createEditFilesToolFinish(
  state: EditFilesToolState,
  context: EditFilesToolContext
) {
  return async function editFilesToolFinish(options: ToolCallOptions): Promise<void> {
    // Mark as complete
    state.isComplete = true;

    // Parse the final complete input
    try {
      const finalInput = EditFilesToolInputSchema.parse(JSON.parse(state.args || '{}'));

      // Update state with final parsed edits
      state.edits = finalInput.edits;

      // Update database entry with final complete input
      if (state.entry_id) {
        const transformToDb = createEditFilesToolTransformHelper(context);
        const dbEntry = transformToDb({
          entry_id: state.entry_id,
          tool_name: 'edit_files',
          args: finalInput,
          result: state.executionResults
            ? {
                results: state.executionResults,
                summary: {
                  total: state.executionResults.length,
                  successful: state.executionResults.filter((r) => r.status === 'success').length,
                  failed: state.executionResults.filter((r) => r.status === 'error').length,
                },
              }
            : undefined,
          status: state.executionResults ? 'success' : 'loading',
          started_at: new Date(),
          completed_at: state.executionResults ? new Date() : undefined,
        });

        await updateMessageEntries({
          messageId: context.messageId,
          entries: [dbEntry],
        });
      }
    } catch (parseError) {
      console.error('[edit-files-tool] Failed to parse final input:', {
        messageId: context.messageId,
        args: state.args,
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
      });

      // Update database with parse error
      if (state.entry_id) {
        const transformToDb = createEditFilesToolTransformHelper(context);
        const dbEntry = transformToDb({
          entry_id: state.entry_id,
          tool_name: 'edit_files',
          args: { raw: state.args },
          result: { error: 'Failed to parse input arguments' },
          status: 'error',
          started_at: new Date(),
          completed_at: new Date(),
        });

        await updateMessageEntries({
          messageId: context.messageId,
          entries: [dbEntry],
        });
      }
    }
  };
}
