import { updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { normalizeEscapedText } from '../../../utils/streaming/escape-normalizer';
import {
  createSequentialThinkingRawLlmMessageEntry,
  createSequentialThinkingReasoningMessage,
} from './helpers/sequential-thinking-tool-transform-helper';
import {
  SEQUENTIAL_THINKING_TOOL_NAME,
  type SequentialThinkingContext,
  type SequentialThinkingInput,
  type SequentialThinkingOutput,
  type SequentialThinkingState,
} from './sequential-thinking-tool';

// Process sequential thinking execution
async function processSequentialThinking(
  input: SequentialThinkingInput,
  state: SequentialThinkingState,
  context: SequentialThinkingContext
): Promise<SequentialThinkingOutput> {
  try {
    // Log the thinking step for debugging
    if (context.messageId) {
      console.info('[sequential-thinking] Processing thought:', {
        messageId: context.messageId,
        thoughtNumber: input.thoughtNumber,
        nextThoughtNeeded: input.nextThoughtNeeded,
      });
    }

    // Since we have the full input object, create the reasoning entries directly
    const toolCallId = state.entry_id;

    if (toolCallId && context.messageId) {
      // Create reasoning entry with completed status using the input values directly
      const reasoningEntry = createSequentialThinkingReasoningMessage(
        {
          entry_id: toolCallId,
          thought: normalizeEscapedText(input.thought),
          nextThoughtNeeded: input.nextThoughtNeeded,
          thoughtNumber: input.thoughtNumber,
        },
        toolCallId,
        'completed' // Mark as completed in execute
      );

      // Create raw LLM message entry using the input values directly
      const rawLlmMessage = createSequentialThinkingRawLlmMessageEntry(
        {
          entry_id: toolCallId,
          thought: normalizeEscapedText(input.thought),
          nextThoughtNeeded: input.nextThoughtNeeded,
          thoughtNumber: input.thoughtNumber,
        },
        toolCallId
      );

      const reasoningMessages = reasoningEntry ? [reasoningEntry] : [];
      const rawLlmMessages = rawLlmMessage ? [rawLlmMessage] : [];

      if (reasoningMessages.length > 0 || rawLlmMessages.length > 0) {
        await updateMessageEntries({
          messageId: context.messageId,
          reasoningMessages,
          rawLlmMessages,
        });

        console.info('[sequential-thinking] Completed sequential thinking in execute:', {
          messageId: context.messageId,
          toolCallId,
          thoughtNumber: input.thoughtNumber,
          nextThoughtNeeded: input.nextThoughtNeeded,
        });
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('[sequential-thinking] Error in sequential thinking:', error);

    throw new Error(
      `Sequential thinking processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Factory function that creates the execute function with proper context typing
export function createSequentialThinkingExecute(
  state: SequentialThinkingState,
  context: SequentialThinkingContext
) {
  return wrapTraced(
    async (input: SequentialThinkingInput): Promise<SequentialThinkingOutput> => {
      return await processSequentialThinking(input, state, context);
    },
    { name: SEQUENTIAL_THINKING_TOOL_NAME }
  );
}
