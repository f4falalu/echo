import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database';
import { createListFilesToolTransformHelper } from './helpers/list-files-tool-transform-helper';
import type { ListFilesToolContext, ListFilesToolState } from './list-files-tool';

export function createListFilesToolStart(state: ListFilesToolState, context: ListFilesToolContext) {
  return async () => {
    try {
      const entry_id = randomUUID();
      state.entry_id = entry_id;
      state.args = '';
      state.paths = undefined;
      state.options = undefined;

      const transformToDb = createListFilesToolTransformHelper(context);
      const dbEntry = transformToDb({
        entry_id,
        tool_name: 'list_files',
        args: {},
        status: 'loading',
        started_at: new Date(),
      });

      await updateMessageEntries({
        messageId: context.messageId,
        entries: [dbEntry],
      });
    } catch (error) {
      console.error('Error in list-files-tool start:', error);
    }
  };
}
