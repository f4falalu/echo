import { type UpdateMessageEntriesParams, updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';
import {
  createDoneToolRawLlmMessageEntry,
  createDoneToolResponseMessage,
} from './helpers/done-tool-transform-helper';

// Type-safe key extraction from the schema - will cause compile error if field name changes
// Using keyof with the inferred type ensures we're using the actual schema keys
const FINAL_RESPONSE_KEY = 'finalResponse' as const satisfies keyof DoneToolInput;

export function createDoneToolDelta(context: DoneToolContext, doneToolState: DoneToolState) {
  return async function doneToolDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Accumulate the delta to the args
    doneToolState.args = (doneToolState.args || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(doneToolState.args);

    // Extract final_response from the optimistically parsed values - type-safe key
    const finalResponse = getOptimisticValue<string>(
      parseResult.extractedValues,
      FINAL_RESPONSE_KEY
    );

    if (finalResponse !== undefined && finalResponse !== '') {
      // Update the state with the extracted final_response
      doneToolState.finalResponse = finalResponse;

      // Create the response entries with the current state
      const doneToolResponseEntry = createDoneToolResponseMessage(
        doneToolState,
        options.toolCallId
      );
      const doneToolMessage = createDoneToolRawLlmMessageEntry(
        doneToolState,
        options.toolCallId || ''
      );

      const entries: UpdateMessageEntriesParams = {
        messageId: context.messageId,
      };

      if (doneToolResponseEntry) {
        entries.responseMessages = [doneToolResponseEntry];
      }

      if (doneToolMessage) {
        entries.rawLlmMessages = [doneToolMessage];
      }

      try {
        if (entries.responseMessages || entries.rawLlmMessages) {
          await updateMessageEntries(entries);
        }
      } catch (error) {
        console.error('[done-tool] Failed to update done tool raw LLM message:', error);
      }
    }
  };
}
