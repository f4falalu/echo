import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database';
import type { DeleteFilesToolContext, DeleteFilesToolState } from './delete-files-tool';
import { createDeleteFilesToolTransformHelper } from './helpers/delete-files-tool-transform-helper';

export function createDeleteFilesToolStart(
  state: DeleteFilesToolState,
  context: DeleteFilesToolContext
) {
  return async () => {
    try {
      const entry_id = randomUUID();
      state.entry_id = entry_id;
      state.args = '';
      state.paths = undefined;

      const transformToDb = createDeleteFilesToolTransformHelper(context);
      const dbEntry = transformToDb({
        entry_id,
        tool_name: 'delete_files',
        args: {},
        status: 'loading',
        started_at: new Date(),
      });

      await updateMessageEntries({
        messageId: context.messageId,
        entries: [dbEntry],
      });
    } catch (error) {
      console.error('Error in delete-files-tool start:', error);
    }
  };
}
