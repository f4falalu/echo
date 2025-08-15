import { updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { normalizeEscapedText } from '../../../utils/streaming/escape-normalizer';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
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
  toolCallId: string,
  messageId: string
): Promise<SequentialThinkingOutput> {
  const output: SequentialThinkingOutput = {
    success: true,
  };

  const rawToolResultEntry = createRawToolResultEntry(
    toolCallId,
    SEQUENTIAL_THINKING_TOOL_NAME,
    output
  );

  try {
    await updateMessageEntries({
      messageId,
      rawLlmMessages: [rawToolResultEntry],
    });
  } catch (error) {
    console.error('[sequential-thinking] Error updating message entries:', error);
  }

  return {
    success: true,
  };
}

// Factory function that creates the execute function with proper context typing
export function createSequentialThinkingExecute(
  state: SequentialThinkingState,
  context: SequentialThinkingContext
) {
  return wrapTraced(
    async (_input: SequentialThinkingInput): Promise<SequentialThinkingOutput> => {
      if (!state.toolCallId) {
        throw new Error('Tool call ID is required');
      }

      return await processSequentialThinking(state.toolCallId, context.messageId);
    },
    { name: SEQUENTIAL_THINKING_TOOL_NAME }
  );
}
