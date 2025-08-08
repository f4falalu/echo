import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database';
import { createReadFilesToolTransformHelper } from './helpers/read-files-tool-transform-helper';
import type { ReadFilesToolContext, ReadFilesToolState } from './read-files-tool';

export function createReadFilesToolStart(state: ReadFilesToolState, context: ReadFilesToolContext) {
  return async () => {
    try {
      const entry_id = randomUUID();
      state.entry_id = entry_id;
      state.args = '';
      state.files = undefined;

      const transformToDb = createReadFilesToolTransformHelper(context);
      const dbEntry = transformToDb({
        entry_id,
        tool_name: 'read_files',
        args: {},
        status: 'loading',
        started_at: new Date(),
      });

      await updateMessageEntries({
        messageId: context.messageId,
        entries: [dbEntry],
      });
    } catch (error) {
      console.error('Error in read-files-tool start:', error);
    }
  };
}
