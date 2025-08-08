import { updateMessageEntries } from '@buster/database';
import type {
  CreateFilesToolContext,
  CreateFilesToolInput,
  CreateFilesToolState,
} from './create-files-tool';
import { createCreateFilesToolTransformHelper } from './helpers/create-files-tool-transform-helper';

export function createCreateFilesToolFinish(
  state: CreateFilesToolState,
  context: CreateFilesToolContext
) {
  return async ({ input }: { input: CreateFilesToolInput }) => {
    try {
      if (!state.entry_id) {
        return;
      }

      // Update state with complete input
      state.files = input.files;

      // Update database with final complete input
      const transformToDb = createCreateFilesToolTransformHelper(context);
      const dbEntry = transformToDb({
        entry_id: state.entry_id,
        tool_name: 'create_files',
        args: {
          files: state.files,
        },
        status: 'ready_to_execute',
        started_at: new Date(),
      });

      await updateMessageEntries({
        messageId: context.messageId,
        entries: [dbEntry],
      });
    } catch (error) {
      console.error('Error in create-files-tool finish:', error);
    }
  };
}
