import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { ExecuteSqlContext, ExecuteSqlState } from './execute-sql';
import {
  createExecuteSqlRawLlmMessageEntry,
  createExecuteSqlReasoningEntry,
} from './helpers/execute-sql-transform-helper';

export function createExecuteSqlStart(state: ExecuteSqlState, context: ExecuteSqlContext) {
  return async function executeSqlStart(options: ToolCallOptions): Promise<void> {
    // Reset state for new tool call to prevent contamination from previous calls
    state.toolCallId = options.toolCallId;
    state.args = '';
    state.statements = [];
    state.isComplete = false;
    state.startTime = Date.now();
    state.executionTime = undefined;
    state.executionResults = undefined;

    // Create initial reasoning entry for SQL execution
    const reasoningEntry = createExecuteSqlReasoningEntry(state, options.toolCallId);
    const rawLlmMessage = createExecuteSqlRawLlmMessageEntry(state, options.toolCallId);

    // Save initial entries to database
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
        console.error('[execute-sql] Failed to create initial entries:', {
          messageId: context.messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
