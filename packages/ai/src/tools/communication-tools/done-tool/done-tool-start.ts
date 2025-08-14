import { updateMessage, updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { UpdateMessageEntriesParams } from '../../../../../database/src/queries/messages/update-message-entries';
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

        // Add all files as response entries to the database in a single batch
        try {
          await updateMessageEntries({
            messageId: context.messageId,
            responseMessages: fileResponses,
          });
        } catch (error) {
          console.error('[done-tool] Failed to add file response entries:', error);
        }
      }
    }

    const doneToolResponseEntry = createDoneToolResponseMessage(doneToolState, options.toolCallId);
    const doneToolMessage = createDoneToolRawLlmMessageEntry(doneToolState, options.toolCallId);

    const entries: UpdateMessageEntriesParams = {
      messageId: context.messageId,
    };

    if (doneToolResponseEntry) {
      entries.responseMessages = [doneToolResponseEntry];
    }

    if (doneToolMessage) {
      entries.rawLlmMessages = [doneToolMessage];
    }

    try {
      if (entries.responseMessages || entries.rawLlmMessages) {
        await updateMessageEntries(entries);
      }

      // Mark message as completed and add final reasoning message with workflow time
      if (context.messageId) {
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

        await updateMessage(context.messageId, {
          isCompleted: true,
          finalReasoningMessage: `Reasoned for ${timeString}`,
        });
      }
    } catch (error) {
      console.error('[done-tool] Failed to update done tool raw LLM message:', error);
    }
  };
}
