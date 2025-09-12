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
export function createTodosStepFinish(
  todosState: CreateTodosState,
  context: CreateTodosContext,
  injectPersonalizationTodo: boolean
) {
  return async function todosStepFinish(result: CreateTodosInput): Promise<void> {
    const personalizationStaticToDo = `\n[ ] Determine if any of the user's personalized instructions are relevant to this question`;

    // Update state with final values
    todosState.todos = result.todos;
    todosState.is_complete = true;

    // Inject the personalization todo if needed
    if (injectPersonalizationTodo) {
      todosState.todos += personalizationStaticToDo;
    }

    // Create final reasoning message with completed status
    const todosReasoningEntry = createTodosReasoningMessage(todosState);
    const todosRawMessages = createTodosRawLlmMessageEntry(todosState);

    try {
      if (todosReasoningEntry && todosRawMessages) {
        await updateMessageEntries({
          messageId: context.messageId,
          reasoningMessages: [todosReasoningEntry],
          rawLlmMessages: todosRawMessages,
        });
      }
    } catch (error) {
      console.error('[create-todos-step] Failed to finalize TODO reasoning message:', error);
    }
  };
}
