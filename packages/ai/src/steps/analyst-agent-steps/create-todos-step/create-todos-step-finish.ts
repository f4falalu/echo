import { updateMessageEntries } from '@buster/database';
import type { CreateTodosContext, CreateTodosInput, CreateTodosState } from './create-todos-step';
import {
  createTodosRawLlmMessageEntry,
  createTodosReasoningMessage,
} from './helpers/create-todos-transform-helper';

/**
 * Factory function that creates a finish handler for TODO creation
 * Called when streaming completes to finalize the reasoning message
 */
export function createTodosStepFinish(todosState: CreateTodosState, context: CreateTodosContext) {
  return async function todosStepFinish(result: CreateTodosInput): Promise<void> {
    // Update state with final values
    todosState.todos = result.todos;
    todosState.is_complete = true;

    // Create final reasoning message with completed status
    const todosReasoningEntry = createTodosReasoningMessage(todosState);
    const todosRawMessage = createTodosRawLlmMessageEntry(todosState);

    try {
      if (todosReasoningEntry && todosRawMessage) {
        await updateMessageEntries({
          messageId: context.messageId,
          reasoningEntry: todosReasoningEntry,
          rawLlmMessage: todosRawMessage,
          toolCallId: todosState.entry_id || '',
        });
      }
    } catch (error) {
      console.error('[create-todos-step] Failed to finalize TODO reasoning message:', error);
    }
  };
}
