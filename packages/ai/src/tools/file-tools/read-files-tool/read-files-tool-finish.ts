import { updateMessageEntries } from '@buster/database';
import { createReadFilesToolTransformHelper } from './helpers/read-files-tool-transform-helper';
import type {
  ReadFilesToolContext,
  ReadFilesToolInput,
  ReadFilesToolState,
} from './read-files-tool';

export function createReadFilesToolFinish(
  state: ReadFilesToolState,
  context: ReadFilesToolContext
) {
  return async ({ input }: { input: ReadFilesToolInput }) => {
    try {
      if (!state.entry_id) {
        return;
      }

      const transformToDb = createReadFilesToolTransformHelper(context);
      const dbEntry = transformToDb({
        entry_id: state.entry_id,
        tool_name: 'read_files',
        args: input,
        status: 'loading',
        started_at: new Date(),
      });

      await updateMessageEntries({
        messageId: context.messageId,
        entries: [dbEntry],
      });
    } catch (error) {
      console.error('Error in read-files-tool finish:', error);
    }
  };
}
