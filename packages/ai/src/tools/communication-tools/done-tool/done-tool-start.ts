import { updateOrAppendRawLlmMessageEntry, updateOrAppendResponseEntry } from '@buster/database';
import type { ModelMessage, ToolCallOptions } from 'ai';
import type { DoneToolContext, DoneToolState } from './done-tool';
import {
  createFileResponseMessages,
  extractFilesFromToolCalls,
} from './helpers/done-tool-file-selection';
import {
  createDoneToolRawLlmMessageEntry,
  createDoneToolResponseMessage,
} from './helpers/done-tool-transform-helper';

// Factory function that creates a type-safe callback for the specific agent context
export function createDoneToolStart<TAgentContext extends DoneToolContext>(
  doneToolState: DoneToolState,
  context: TAgentContext
) {
  return async function doneToolStart(
    options: ToolCallOptions & { messages?: ModelMessage[] }
  ): Promise<void> {
    doneToolState.entry_id = options.toolCallId;

    // Extract files from the tool call responses in messages
    if (options.messages) {
      const extractedFiles = extractFilesFromToolCalls(options.messages);

      if (extractedFiles.length > 0 && context.messageId) {
        const fileResponses = createFileResponseMessages(extractedFiles);

        // Add each file as a response entry to the database
        for (const fileResponse of fileResponses) {
          try {
            await updateOrAppendResponseEntry(context.messageId, fileResponse, 'append');
          } catch (error) {
            console.error('[done-tool] Failed to add file response entry:', error);
          }
        }
      }
    }

    const doneToolResponseEntry = createDoneToolResponseMessage(doneToolState, options.toolCallId);
    const doneToolMessage = createDoneToolRawLlmMessageEntry(doneToolState, options.toolCallId);

    try {
      if (doneToolMessage) {
        await updateOrAppendRawLlmMessageEntry(context.messageId, doneToolMessage, 'append');
      }
    } catch (error) {
      console.error('[done-tool] Failed to add done tool to raw LLM messages:', error);
    }

    try {
      if (doneToolResponseEntry) {
        await updateOrAppendResponseEntry(context.messageId, doneToolResponseEntry, 'append');
      }
    } catch (error) {
      console.error('[done-tool] Failed to add done tool response entry:', error);
    }
  };
}
