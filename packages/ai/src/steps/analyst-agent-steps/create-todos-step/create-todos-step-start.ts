import { updateMessageEntries } from '@buster/database';
import type { CreateTodosContext, CreateTodosState } from './create-todos-step';
import {
  createTodosRawLlmMessageEntry,
  createTodosReasoningMessage,
} from './helpers/create-todos-transform-helper';

/**
 * Factory function that creates a type-safe callback for the TODO creation context
 * Called when streaming starts to initialize the reasoning message
 */
export function createTodosStepStart(todosState: CreateTodosState, context: CreateTodosContext) {
  return async function todosStepStart(): Promise<void> {
    // Generate a unique ID for this TODO creation and set start time
    const toolCallId = `todos-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    todosState.entry_id = toolCallId;
    todosState.startTime = Date.now();

    // Create initial reasoning message with loading status
    const todosReasoningEntry = createTodosReasoningMessage(todosState, toolCallId);
    const todosRawMessage = createTodosRawLlmMessageEntry(todosState, toolCallId);

    try {
      if (todosReasoningEntry && todosRawMessage) {
        await updateMessageEntries({
          messageId: context.messageId,
          reasoningEntry: todosReasoningEntry,
          rawLlmMessage: todosRawMessage,
          toolCallId,
        });
      }
    } catch (error) {
      console.error('[create-todos-step] Failed to initialize TODO reasoning message:', error);
    }
  };
}
