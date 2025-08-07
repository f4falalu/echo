import type {
  ChatMessageReasoningMessage,
  ChatMessageReasoningMessage_Text,
  ChatMessageReasoning_status,
} from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import type { SequentialThinkingState } from '../sequential-thinking-tool';

/**
 * Create a reasoning message entry for sequential thinking
 * This creates a text-type reasoning message that shows the current thought
 */
export function createSequentialThinkingReasoningMessage(
  sequentialThinkingState: SequentialThinkingState,
  toolCallId?: string,
  status: ChatMessageReasoning_status = 'loading'
): ChatMessageReasoningMessage_Text | null {
  // Use entry_id from state or fallback to provided toolCallId
  const id = sequentialThinkingState.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  // Determine title based on status
  const title = status === 'completed' ? 'Thought for a few seconds' : 'Thinking it through...';

  // Determine if reasoning is finished based on nextThoughtNeeded
  const finishedReasoning = sequentialThinkingState.nextThoughtNeeded === false;

  const reasoningMessage: ChatMessageReasoningMessage_Text = {
    id,
    type: 'text',
    title,
    status,
    message: sequentialThinkingState.thought || '',
    message_chunk: undefined,
    secondary_title: undefined,
    finished_reasoning: finishedReasoning,
  };

  return reasoningMessage;
}

/**
 * Create a raw LLM message entry for sequential thinking
 * This represents the raw tool call in the LLM message format
 */
export function createSequentialThinkingRawLlmMessageEntry(
  sequentialThinkingState: SequentialThinkingState,
  toolCallId?: string
): ModelMessage | null {
  const id = sequentialThinkingState.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  // Build the input object with available state
  const input: Record<string, unknown> = {};

  if (sequentialThinkingState.thought !== undefined) {
    input.thought = sequentialThinkingState.thought;
  }

  if (sequentialThinkingState.nextThoughtNeeded !== undefined) {
    input.nextThoughtNeeded = sequentialThinkingState.nextThoughtNeeded;
  }

  if (sequentialThinkingState.thoughtNumber !== undefined) {
    input.thoughtNumber = sequentialThinkingState.thoughtNumber;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: id,
        toolName: 'sequentialThinking',
        input,
      },
    ],
  };
}
