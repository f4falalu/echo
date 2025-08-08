import { updateMessageEntries } from '@buster/database';
import { createListFilesToolTransformHelper } from './helpers/list-files-tool-transform-helper';
import type {
  ListFilesToolContext,
  ListFilesToolInput,
  ListFilesToolState,
} from './list-files-tool';

export function createListFilesToolFinish(
  state: ListFilesToolState,
  context: ListFilesToolContext
) {
  return async ({ input }: { input: ListFilesToolInput }) => {
    try {
      if (!state.entry_id) {
        return;
      }

      const transformToDb = createListFilesToolTransformHelper(context);
      const dbEntry = transformToDb({
        entry_id: state.entry_id,
        tool_name: 'list_files',
        args: input,
        status: 'loading',
        started_at: new Date(),
      });

      await updateMessageEntries({
        messageId: context.messageId,
        entries: [dbEntry],
      });
    } catch (error) {
      console.error('Error in list-files-tool finish:', error);
    }
  };
}
