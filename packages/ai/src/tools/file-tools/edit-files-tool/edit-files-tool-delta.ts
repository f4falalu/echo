import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import type {
  EditFilesToolContext,
  EditFilesToolInput,
  EditFilesToolState,
} from './edit-files-tool';
import { createEditFilesToolTransformHelper } from './helpers/edit-files-tool-transform-helper';

// Type-safe key extraction from the schema
const EDITS_KEY = 'edits' as const satisfies keyof EditFilesToolInput;

export function createEditFilesToolDelta(state: EditFilesToolState, context: EditFilesToolContext) {
  return async function editFilesToolDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Accumulate the delta to the args
    state.args = (state.args || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(state.args);

    // Extract edits from the optimistically parsed values
    const rawEdits = getOptimisticValue<unknown>(parseResult.extractedValues, EDITS_KEY, []);

    // Ensure edits is an array of valid edit objects
    let edits: Array<{
      filePath: string;
      findString: string;
      replaceString: string;
    }> = [];

    if (Array.isArray(rawEdits)) {
      edits = rawEdits.filter(
        (
          edit
        ): edit is {
          filePath: string;
          findString: string;
          replaceString: string;
        } =>
          edit &&
          typeof edit === 'object' &&
          'filePath' in edit &&
          'findString' in edit &&
          'replaceString' in edit &&
          typeof edit.filePath === 'string' &&
          typeof edit.findString === 'string' &&
          typeof edit.replaceString === 'string'
      );
    }

    // Update state with parsed edits
    if (edits.length > 0) {
      state.edits = edits;
    }

    // Update database entry with current streaming state (keep status as loading)
    if (state.entry_id) {
      const transformToDb = createEditFilesToolTransformHelper(context);
      const dbEntry = transformToDb({
        entry_id: state.entry_id,
        tool_name: 'edit_files',
        args: { edits: state.edits || [] },
        status: 'loading',
        started_at: new Date(),
      });

      try {
        await updateMessageEntries({
          messageId: context.messageId,
          entries: [dbEntry],
        });
      } catch (error) {
        console.error('[edit-files-tool] Failed to update entry during delta:', {
          messageId: context.messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
