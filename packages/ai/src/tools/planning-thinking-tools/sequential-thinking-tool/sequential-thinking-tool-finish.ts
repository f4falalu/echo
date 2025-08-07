import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { normalizeEscapedText } from '../../../utils/streaming/escape-normalizer';
import {
  createSequentialThinkingRawLlmMessageEntry,
  createSequentialThinkingReasoningMessage,
} from './helpers/sequential-thinking-tool-transform-helper';
import type {
  SequentialThinkingContext,
  SequentialThinkingInput,
  SequentialThinkingState,
} from './sequential-thinking-tool';

export function createSequentialThinkingFinish<TAgentContext extends SequentialThinkingContext>(
  sequentialThinkingState: SequentialThinkingState,
  context: TAgentContext
) {
  return async function sequentialThinkingFinish(
    options: { input: SequentialThinkingInput } & ToolCallOptions
  ): Promise<void> {
    // Update state with the final input values
    sequentialThinkingState.entry_id = options.toolCallId;
    sequentialThinkingState.thought = normalizeEscapedText(options.input.thought);
    sequentialThinkingState.nextThoughtNeeded = options.input.nextThoughtNeeded;
    sequentialThinkingState.thoughtNumber = options.input.thoughtNumber;

    // Create final reasoning entry with completed status
    const reasoningEntry = createSequentialThinkingReasoningMessage(
      sequentialThinkingState,
      options.toolCallId,
      'completed' // Mark as completed when finish is called
    );

    // Create final raw LLM message entry
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
          mode: 'update',
        });

        console.info('[sequential-thinking] Completed sequential thinking:', {
          messageId: context.messageId,
          toolCallId: options.toolCallId,
          thoughtNumber: options.input.thoughtNumber,
          nextThoughtNeeded: options.input.nextThoughtNeeded,
        });
      }
    } catch (error) {
      console.error('[sequential-thinking] Failed to update reasoning entry on finish:', error);
    }
  };
}
