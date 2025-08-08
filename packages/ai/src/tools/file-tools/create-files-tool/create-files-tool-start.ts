import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database';
import type { CreateFilesToolContext, CreateFilesToolState } from './create-files-tool';
import { createCreateFilesToolTransformHelper } from './helpers/create-files-tool-transform-helper';

export function createCreateFilesToolStart(
  state: CreateFilesToolState,
  context: CreateFilesToolContext
) {
  return async () => {
    try {
      // Generate unique entry ID
      state.entry_id = randomUUID();

      // Create database entry for this tool execution
      const transformToDb = createCreateFilesToolTransformHelper(context);
      const dbEntry = transformToDb({
        entry_id: state.entry_id,
        tool_name: 'create_files',
        args: {},
        status: 'loading',
        started_at: new Date(),
      });

      // Update database with initial entry
      await updateMessageEntries({
        messageId: context.messageId,
        entries: [dbEntry],
      });
    } catch (error) {
      console.error('Error in create-files-tool start:', error);
    }
  };
}
