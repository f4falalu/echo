import { updateMessageEntries } from '@buster/database';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import { createListFilesToolTransformHelper } from './helpers/list-files-tool-transform-helper';
import type {
  ListFilesToolContext,
  ListFilesToolInput,
  ListFilesToolState,
} from './list-files-tool';

export function createListFilesToolDelta(state: ListFilesToolState, context: ListFilesToolContext) {
  return async ({ delta }: { delta: { type: 'text-delta'; textDelta: string } }) => {
    try {
      if (!state.entry_id || delta.type !== 'text-delta') {
        return;
      }

      state.args = (state.args || '') + delta.textDelta;

      const parseResult = OptimisticJsonParser.parse(state.args);
      const paths = getOptimisticValue<string[]>(
        parseResult.extractedValues,
        'paths' as const satisfies keyof ListFilesToolInput
      );
      const options = getOptimisticValue<ListFilesToolInput['options']>(
        parseResult.extractedValues,
        'options' as const satisfies keyof ListFilesToolInput
      );

      const hasUpdate = (paths && !state.paths) || (options && !state.options);

      if (paths) state.paths = paths;
      if (options) state.options = options;

      if (hasUpdate) {
        const transformToDb = createListFilesToolTransformHelper(context);
        const dbEntry = transformToDb({
          entry_id: state.entry_id,
          tool_name: 'list_files',
          args: {
            paths: state.paths,
            options: state.options,
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
      console.error('Error in list-files-tool delta:', error);
    }
  };
}
