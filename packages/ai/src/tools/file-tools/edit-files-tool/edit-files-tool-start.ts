import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import type { EditFilesToolContext, EditFilesToolState } from './edit-files-tool';
import { createEditFilesToolTransformHelper } from './helpers/edit-files-tool-transform-helper';

export function createEditFilesToolStart(state: EditFilesToolState, context: EditFilesToolContext) {
  return async function editFilesToolStart(options: ToolCallOptions): Promise<void> {
    // Initialize state
    state.entry_id = uuidv4();
    state.args = '';
    state.edits = [];
    state.isComplete = false;
    state.executionResults = undefined;

    // Create initial database entry for file editing
    const transformToDb = createEditFilesToolTransformHelper(context);
    const dbEntry = transformToDb({
      entry_id: state.entry_id,
      tool_name: 'edit_files',
      args: {},
      status: 'loading',
      started_at: new Date(),
    });

    try {
      await updateMessageEntries({
        messageId: context.messageId,
        entries: [dbEntry],
      });
    } catch (error) {
      console.error('[edit-files-tool] Failed to create initial entry:', {
        messageId: context.messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
