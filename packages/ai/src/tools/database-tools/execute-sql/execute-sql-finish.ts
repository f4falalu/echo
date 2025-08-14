import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { ExecuteSqlContext, ExecuteSqlInput, ExecuteSqlState } from './execute-sql';
import {
  createExecuteSqlRawLlmMessageEntry,
  createExecuteSqlReasoningEntry,
} from './helpers/execute-sql-transform-helper';

export function createExecuteSqlFinish(state: ExecuteSqlState, context: ExecuteSqlContext) {
  return async function executeSqlFinish(
    options: { input: ExecuteSqlInput } & ToolCallOptions
  ): Promise<void> {
    // Update state with final input
    state.toolCallId = options.toolCallId;
    state.statements = options.input.statements;
    state.isComplete = true;

    // Create reasoning entry - still loading status
    // We don't mark as complete here - that happens after execution
    const reasoningEntry = createExecuteSqlReasoningEntry(state, options.toolCallId);
    const rawLlmMessage = createExecuteSqlRawLlmMessageEntry(state, options.toolCallId);

    const messagesToSave: Parameters<typeof updateMessageEntries>[0] = {
      messageId: context.messageId,
    };

    if (reasoningEntry) {
      messagesToSave.reasoningMessages = [reasoningEntry];
    }

    if (rawLlmMessage) {
      messagesToSave.rawLlmMessages = [rawLlmMessage];
    }

    if (messagesToSave.reasoningMessages || messagesToSave.rawLlmMessages) {
      try {
        await updateMessageEntries(messagesToSave);
      } catch (error) {
        console.error('[execute-sql] Failed to finalize entries:', {
          messageId: context.messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
