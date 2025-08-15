import { updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
import {
  DONE_TOOL_NAME,
  type DoneToolContext,
  type DoneToolInput,
  type DoneToolOutput,
  type DoneToolState,
} from './done-tool';

// Process done tool execution with todo management
async function processDone(toolCallId: string, messageId: string): Promise<DoneToolOutput> {
  const output: DoneToolOutput = {
    success: true,
  };

  const rawToolResultEntry = createRawToolResultEntry(toolCallId, DONE_TOOL_NAME, output);

  try {
    await updateMessageEntries({
      messageId,
      rawLlmMessages: [rawToolResultEntry],
    });
  } catch (error) {
    console.error('[done-tool] Error updating message entries:', error);
  }

  return output;
}

// Factory function that creates the execute function with proper context typing
export function createDoneToolExecute(context: DoneToolContext, state: DoneToolState) {
  return wrapTraced(
    async (_input: DoneToolInput): Promise<DoneToolOutput> => {
      if (!state.toolCallId) {
        throw new Error('Tool call ID is required');
      }

      return processDone(state.toolCallId, context.messageId);
    },
    { name: 'Done Tool' }
  );
}
