import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import {
  type DoneToolContext,
  type DoneToolInput,
  DoneToolInputSchema,
  type DoneToolState,
} from './done-tool';
import {
  createDoneToolRawLlmMessageEntry,
  createDoneToolResponseMessage,
} from './helpers/done-tool-transform-helper';

// Type-safe key extraction from the schema - will cause compile error if field name changes
// Using keyof with the inferred type ensures we're using the actual schema keys
const FINAL_RESPONSE_KEY = 'final_response' as const satisfies keyof DoneToolInput;

export function createDoneToolDelta(doneToolState: DoneToolState, context: DoneToolContext) {
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
      doneToolState.final_response = finalResponse;

      // Create the response entries with the current state
      const doneToolResponseEntry = createDoneToolResponseMessage(
        doneToolState,
        options.toolCallId
      );
      const doneToolMessage = createDoneToolRawLlmMessageEntry(doneToolState, options.toolCallId);

      try {
        if (doneToolMessage) {
          await updateMessageEntries({
            messageId: context.messageId,
            responseEntry: doneToolResponseEntry,
            rawLlmMessage: doneToolMessage,
            mode: 'append',
          });
        }
      } catch (error) {
        console.error('[done-tool] Failed to update done tool raw LLM message:', error);
      }
    }
  };
}
