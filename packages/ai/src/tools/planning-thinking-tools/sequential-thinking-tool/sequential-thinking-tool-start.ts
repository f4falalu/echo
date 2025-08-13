import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createSequentialThinkingRawLlmMessageEntry,
  createSequentialThinkingReasoningMessage,
} from './helpers/sequential-thinking-tool-transform-helper';
import type {
  SequentialThinkingContext,
  SequentialThinkingState,
} from './sequential-thinking-tool';

// Factory function that creates a type-safe callback for the specific agent context
export function createSequentialThinkingStart(
  sequentialThinkingState: SequentialThinkingState,
  context: SequentialThinkingContext
) {
  return async function sequentialThinkingStart(options: ToolCallOptions): Promise<void> {
    // Set the entry ID in state
    sequentialThinkingState.entry_id = options.toolCallId;

    // Create initial reasoning entry with loading status
    const reasoningEntry = createSequentialThinkingReasoningMessage(
      sequentialThinkingState,
      options.toolCallId
    );

    // Create initial raw LLM message entry
    const rawLlmMessage = createSequentialThinkingRawLlmMessageEntry(
      sequentialThinkingState,
      options.toolCallId
    );

    try {
      if (reasoningEntry && rawLlmMessage && context.messageId) {
        await updateMessageEntries({
          messageId: context.messageId,
          reasoningEntry,
          rawLlmMessage,
          toolCallId: options.toolCallId,
        });

        console.info('[sequential-thinking] Started sequential thinking:', {
          messageId: context.messageId,
          toolCallId: options.toolCallId,
        });
      }
    } catch (error) {
      console.error('[sequential-thinking] Failed to update reasoning entry on start:', error);
    }
  };
}
