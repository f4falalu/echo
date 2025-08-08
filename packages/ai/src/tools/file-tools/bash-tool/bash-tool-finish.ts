import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { BashToolContext, BashToolInput, BashToolState } from './bash-tool';
import {
  createBashToolRawLlmMessageEntry,
  createBashToolReasoningEntry,
} from './helpers/bash-tool-transform-helper';

export function createBashToolFinish(state: BashToolState, context: BashToolContext) {
  return async function bashToolFinish(
    input: BashToolInput,
    options: ToolCallOptions
  ): Promise<void> {
    // Mark as complete and update final state
    state.isComplete = true;
    state.commands = input.commands;

    // Update database entries with final input data
    const reasoningEntry = createBashToolReasoningEntry(state, options.toolCallId);
    const rawLlmMessage = createBashToolRawLlmMessageEntry(state, options.toolCallId);

    if (reasoningEntry && rawLlmMessage) {
      try {
        await updateMessageEntries({
          messageId: context.messageId,
          reasoningEntry,
          rawLlmMessage,
          mode: 'update',
        });
      } catch (error) {
        console.error('[bash-tool] Failed to update entries on finish:', {
          messageId: context.messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
