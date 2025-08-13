import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  messageUserClarifyingQuestionRawLlmMessageEntry,
  messageUserClarifyingQuestionResponseMessage,
} from './helpers/message-user-clarifying-question-transform-helper';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Factory function for onInputStart callback
export function createMessageUserClarifyingQuestionStart(
  context: MessageUserClarifyingQuestionContext,
  state: MessageUserClarifyingQuestionState
) {
  return async (options: ToolCallOptions) => {
    const messageId = context.messageId;

    // Initialize state
    state.toolCallId = options.toolCallId;

    // If we have a messageId, create initial database entries
    if (messageId) {
      try {
        // Create initial response entry (empty, will be updated with streaming)
        const responseEntry = messageUserClarifyingQuestionResponseMessage(state.toolCallId, state);

        // Create raw LLM message entry
        const rawLlmEntry = messageUserClarifyingQuestionRawLlmMessageEntry(
          state.toolCallId,
          state
        );

        // Update database with initial entries (append mode)
        await updateMessageEntries({
          messageId,
          responseEntry,
          rawLlmMessage: rawLlmEntry,
          toolCallId: options.toolCallId,
        });
      } catch (error) {
        console.error(
          '[message-user-clarifying-question] Failed to create initial database entries',
          {
            messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }
    }
  };
}
