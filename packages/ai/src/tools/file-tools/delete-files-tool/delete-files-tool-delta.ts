import { updateMessageEntries } from '@buster/database';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import type {
  DeleteFilesToolContext,
  DeleteFilesToolInput,
  DeleteFilesToolState,
} from './delete-files-tool';
import { createDeleteFilesToolTransformHelper } from './helpers/delete-files-tool-transform-helper';

export function createDeleteFilesToolDelta(
  state: DeleteFilesToolState,
  context: DeleteFilesToolContext
) {
  return async ({ delta }: { delta: { type: 'text-delta'; textDelta: string } }) => {
    try {
      if (!state.entry_id || delta.type !== 'text-delta') {
        return;
      }

      state.args = (state.args || '') + delta.textDelta;

      const parseResult = OptimisticJsonParser.parse(state.args);
      const paths = getOptimisticValue<string[]>(
        parseResult.extractedValues,
        'paths' as const satisfies keyof DeleteFilesToolInput
      );

      const hasUpdate = paths && !state.paths;

      if (paths) state.paths = paths;

      if (hasUpdate) {
        const transformToDb = createDeleteFilesToolTransformHelper(context);
        const dbEntry = transformToDb({
          entry_id: state.entry_id,
          tool_name: 'delete_files',
          args: {
            paths: state.paths,
          },
          status: 'loading',
          started_at: new Date(),
        });

        await updateMessageEntries({
          messageId: context.messageId,
          entries: [dbEntry],
        });
      }
    } catch (error) {
      console.error('Error in delete-files-tool delta:', error);
    }
  };
}
