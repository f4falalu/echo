import { updateMessageEntries } from '@buster/database';
import type {
  DeleteFilesToolContext,
  DeleteFilesToolInput,
  DeleteFilesToolState,
} from './delete-files-tool';
import { createDeleteFilesToolTransformHelper } from './helpers/delete-files-tool-transform-helper';

export function createDeleteFilesToolFinish(
  state: DeleteFilesToolState,
  context: DeleteFilesToolContext
) {
  return async ({ input }: { input: DeleteFilesToolInput }) => {
    try {
      if (!state.entry_id) {
        return;
      }

      const transformToDb = createDeleteFilesToolTransformHelper(context);
      const dbEntry = transformToDb({
        entry_id: state.entry_id,
        tool_name: 'delete_files',
        args: input,
        status: 'loading',
        started_at: new Date(),
      });

      await updateMessageEntries({
        messageId: context.messageId,
        entries: [dbEntry],
      });
    } catch (error) {
      console.error('Error in delete-files-tool finish:', error);
    }
  };
}
