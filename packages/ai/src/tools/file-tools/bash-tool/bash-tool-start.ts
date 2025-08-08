import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { BashToolContext, BashToolState } from './bash-tool';
import {
  createBashToolRawLlmMessageEntry,
  createBashToolReasoningEntry,
} from './helpers/bash-tool-transform-helper';

export function createBashToolStart(state: BashToolState, context: BashToolContext) {
  return async function bashToolStart(options: ToolCallOptions): Promise<void> {
    // Initialize state
    state.toolCallId = options.toolCallId;
    state.args = '';
    state.commands = [];
    state.isComplete = false;
    state.startTime = Date.now();

    // Create initial reasoning entry for bash execution
    const reasoningEntry = createBashToolReasoningEntry(state, options.toolCallId);
    const rawLlmMessage = createBashToolRawLlmMessageEntry(state, options.toolCallId);

    // Save initial entries to database
    if (reasoningEntry && rawLlmMessage) {
      try {
        await updateMessageEntries({
          messageId: context.messageId,
          reasoningEntry,
          rawLlmMessage,
          mode: 'append',
        });
      } catch (error) {
        console.error('[bash-tool] Failed to create initial entries:', {
          messageId: context.messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
