import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { ExecuteSqlContext, ExecuteSqlState } from './execute-sql';
import {
  createExecuteSqlRawLlmMessageEntry,
  createExecuteSqlReasoningEntry,
} from './helpers/execute-sql-transform-helper';

export function createExecuteSqlStart(state: ExecuteSqlState, context: ExecuteSqlContext) {
  return async function executeSqlStart(options: ToolCallOptions): Promise<void> {
    // Initialize state
    state.toolCallId = options.toolCallId;
    state.args = '';
    state.statements = [];
    state.isComplete = false;
    state.startTime = Date.now();

    // Create initial reasoning entry for SQL execution
    const reasoningEntry = createExecuteSqlReasoningEntry(state, options.toolCallId);
    const rawLlmMessage = createExecuteSqlRawLlmMessageEntry(state, options.toolCallId);

    // Save initial entries to database
    if (reasoningEntry && rawLlmMessage) {
      try {
        await updateMessageEntries({
          messageId: context.messageId,
          reasoningEntry,
          rawLlmMessage,
          mode: 'append',
        });
      } catch (error) {
        console.error('[execute-sql] Failed to create initial entries:', {
          messageId: context.messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
