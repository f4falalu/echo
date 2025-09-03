import type { ToolCallOptions } from 'ai';
import { normalizeEscapedText } from '../../../utils/streaming/escape-normalizer';
import type {
  SequentialThinkingContext,
  SequentialThinkingInput,
  SequentialThinkingState,
} from './sequential-thinking-tool';

export function createSequentialThinkingFinish(
  sequentialThinkingState: SequentialThinkingState,
  context: SequentialThinkingContext
) {
  return async function sequentialThinkingFinish(
    options: { input: SequentialThinkingInput } & ToolCallOptions
  ): Promise<void> {
    // Update state with the final input values
    sequentialThinkingState.toolCallId = options.toolCallId;
    sequentialThinkingState.thought = normalizeEscapedText(options.input.thought);
    sequentialThinkingState.nextThoughtNeeded = options.input.nextThoughtNeeded;
    sequentialThinkingState.thoughtNumber = options.input.thoughtNumber;

    // No longer update reasoning message here - let execute handle the final update
    // This prevents race conditions between finish and execute
    console.info('[sequential-thinking] Finished streaming sequential thinking:', {
      messageId: context.messageId,
      toolCallId: options.toolCallId,
      thoughtNumber: options.input.thoughtNumber,
      nextThoughtNeeded: options.input.nextThoughtNeeded,
    });
  };
}
