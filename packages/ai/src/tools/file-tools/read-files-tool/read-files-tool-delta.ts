import { updateMessageEntries } from '@buster/database';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import { createReadFilesToolTransformHelper } from './helpers/read-files-tool-transform-helper';
import type {
  ReadFilesToolContext,
  ReadFilesToolInput,
  ReadFilesToolState,
} from './read-files-tool';

export function createReadFilesToolDelta(state: ReadFilesToolState, context: ReadFilesToolContext) {
  return async ({ delta }: { delta: { type: 'text-delta'; textDelta: string } }) => {
    try {
      if (!state.entry_id || delta.type !== 'text-delta') {
        return;
      }

      state.args = (state.args || '') + delta.textDelta;

      const parseResult = OptimisticJsonParser.parse(state.args);
      const files = getOptimisticValue<string[]>(
        parseResult.extractedValues,
        'files' as const satisfies keyof ReadFilesToolInput
      );

      const hasUpdate = files && !state.files;

      if (files) state.files = files;

      if (hasUpdate) {
        const transformToDb = createReadFilesToolTransformHelper(context);
        const dbEntry = transformToDb({
          entry_id: state.entry_id,
          tool_name: 'read_files',
          args: {
            files: state.files,
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
      console.error('Error in read-files-tool delta:', error);
    }
  };
}
