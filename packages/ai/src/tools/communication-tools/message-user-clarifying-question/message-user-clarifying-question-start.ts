import { updateMessage, updateMessageEntries } from '@buster/database';
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
          responseMessages: [responseEntry],
          rawLlmMessages: [rawLlmEntry],
        });

        // Mark message as completed and add final reasoning message with workflow time
        const currentTime = Date.now();
        const elapsedTimeMs = currentTime - context.workflowStartTime;
        const elapsedSeconds = Math.floor(elapsedTimeMs / 1000);

        let timeString: string;
        if (elapsedSeconds < 60) {
          timeString = `${elapsedSeconds} seconds`;
        } else {
          const elapsedMinutes = Math.floor(elapsedSeconds / 60);
          timeString = `${elapsedMinutes} minutes`;
        }

        await updateMessage(messageId, {
          isCompleted: true,
          finalReasoningMessage: `Reasoned for ${timeString}`,
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
