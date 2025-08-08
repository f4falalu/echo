import { updateMessageEntries } from '@buster/database';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import type {
  CreateFilesToolContext,
  CreateFilesToolInput,
  CreateFilesToolState,
} from './create-files-tool';
import { createCreateFilesToolTransformHelper } from './helpers/create-files-tool-transform-helper';

export function createCreateFilesToolDelta(
  state: CreateFilesToolState,
  context: CreateFilesToolContext
) {
  return async ({ delta }: { delta: { type: 'text-delta'; textDelta: string } }) => {
    try {
      if (!state.entry_id || delta.type !== 'text-delta') {
        return;
      }

      state.args = (state.args || '') + delta.textDelta;

      const parseResult = OptimisticJsonParser.parse(state.args);
      const files = getOptimisticValue<CreateFilesToolInput['files']>(
        parseResult.extractedValues,
        'files' as const satisfies keyof CreateFilesToolInput
      );

      const hasUpdate = files && !state.files;

      if (files) state.files = files;

      if (hasUpdate) {
        const transformToDb = createCreateFilesToolTransformHelper(context);
        const dbEntry = transformToDb({
          entry_id: state.entry_id,
          tool_name: 'create_files',
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
      console.error('Error in create-files-tool delta:', error);
    }
  };
}
