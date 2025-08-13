import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
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
export function createDoneToolStart(doneToolState: DoneToolState, context: DoneToolContext) {
  return async function doneToolStart(options: ToolCallOptions): Promise<void> {
    doneToolState.entry_id = options.toolCallId;

    // Extract files from the tool call responses in messages
    if (options.messages) {
      console.info('[done-tool-start] Extracting files from messages', {
        messageCount: options.messages?.length,
        toolCallId: options.toolCallId,
      });

      const extractedFiles = extractFilesFromToolCalls(options.messages);

      console.info('[done-tool-start] Files extracted', {
        extractedCount: extractedFiles.length,
        files: extractedFiles.map((f) => ({ id: f.id, type: f.fileType, name: f.fileName })),
      });

      if (extractedFiles.length > 0 && context.messageId) {
        const fileResponses = createFileResponseMessages(extractedFiles);

        console.info('[done-tool-start] Creating file response messages', {
          responseCount: fileResponses.length,
        });

        // Add each file as a response entry to the database
        for (const fileResponse of fileResponses) {
          try {
            await updateMessageEntries({
              messageId: context.messageId,
              responseEntry: fileResponse,
              toolCallId: options.toolCallId,
            });
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
        await updateMessageEntries({
          messageId: context.messageId,
          responseEntry: doneToolResponseEntry,
          rawLlmMessage: doneToolMessage,
          toolCallId: options.toolCallId,
        });
      }
    } catch (error) {
      console.error('[done-tool] Failed to update done tool raw LLM message:', error);
    }
  };
}
