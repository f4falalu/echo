import { updateMessageEntries } from '@buster/database';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../../utils/streaming/optimistic-json-parser';
import {
  createModifyReportsRawLlmMessageEntry,
  createModifyReportsReasoningEntry,
} from './helpers/modify-reports-transform-helper';
import type {
  ModifyReportsContext,
  ModifyReportsEditState,
  ModifyReportsInput,
  ModifyReportsState,
} from './modify-reports-tool';

// Define TOOL_KEYS locally since we removed them from the helper
const TOOL_KEYS = {
  id: 'id' as const,
  name: 'name' as const,
  edits: 'edits' as const,
  code_to_replace: 'code_to_replace' as const,
  code: 'code' as const,
} satisfies {
  id: keyof ModifyReportsInput;
  name: keyof ModifyReportsInput;
  edits: keyof ModifyReportsInput;
  code_to_replace: keyof ModifyReportsInput['edits'][number];
  code: keyof ModifyReportsInput['edits'][number];
};

// Helper function to create file response message for report being modified
function createModifyReportFileResponseMessage(
  reportId: string,
  reportName: string
): ChatMessageResponseMessage {
  return {
    id: reportId,
    type: 'file' as const,
    file_type: 'report' as const,
    file_name: reportName,
    version_number: 1,
    filter_version_id: null,
    metadata: [
      {
        status: 'loading' as const,
        message: 'Report is being modified...',
        timestamp: Date.now(),
      },
    ],
  };
}

export function createModifyReportsDelta(context: ModifyReportsContext, state: ModifyReportsState) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Try to parse the accumulated JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText || '');

    if (parseResult.parsed) {
      // Extract values from parsed result
      const id = getOptimisticValue<string>(parseResult.extractedValues, TOOL_KEYS.id, '');
      const name = getOptimisticValue<string>(parseResult.extractedValues, TOOL_KEYS.name, '');
      const editsArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        TOOL_KEYS.edits,
        []
      );

      // Track if we need to send file response
      let shouldSendFileResponse = false;

      // Update report metadata
      if (id && !state.reportId) {
        state.reportId = id;
        // Check if we now have both ID and name
        if (state.reportName || name) {
          shouldSendFileResponse = true;
        }
      }
      if (name && !state.reportName) {
        state.reportName = name;
        // Check if we now have both ID and name
        if (state.reportId || id) {
          shouldSendFileResponse = true;
        }
      }

      // Send file response message as soon as we have both ID and name
      if (shouldSendFileResponse && context.messageId) {
        const finalId = state.reportId || id;
        const finalName = state.reportName || name;

        if (finalId && finalName) {
          try {
            const fileResponse = createModifyReportFileResponseMessage(finalId, finalName);
            await updateMessageEntries({
              messageId: context.messageId,
              responseMessages: [fileResponse],
            });

            console.info('[modify-reports] Sent file response message', {
              reportId: finalId,
              reportName: finalName,
            });
          } catch (error) {
            console.error('[modify-reports] Error sending file response:', error);
          }
        }
      }

      // Process edits
      if (editsArray && Array.isArray(editsArray)) {
        // Initialize state edits if needed
        if (!state.edits) {
          state.edits = [];
        }

        // Update state edits with streamed data
        const updatedEdits: ModifyReportsEditState[] = [];

        editsArray.forEach((edit, _index) => {
          if (edit && typeof edit === 'object') {
            const editObj = edit as Record<string, unknown>;
            const codeToReplace = getOptimisticValue<string>(
              new Map(Object.entries(editObj)),
              TOOL_KEYS.code_to_replace,
              ''
            );
            const code = getOptimisticValue<string>(
              new Map(Object.entries(editObj)),
              TOOL_KEYS.code,
              ''
            );

            if (code !== undefined) {
              const operation = codeToReplace === '' ? 'append' : 'replace';
              updatedEdits.push({
                operation,
                code_to_replace: codeToReplace || '',
                code,
                status: 'loading',
              });
            }
          }
        });

        state.edits = updatedEdits;
      }
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createModifyReportsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, options.toolCallId);

        // Update both entries together if they exist
        const updates: Parameters<typeof updateMessageEntries>[0] = {
          messageId: context.messageId,
        };

        if (reasoningEntry) {
          updates.reasoningMessages = [reasoningEntry];
        }

        if (rawLlmMessage) {
          updates.rawLlmMessages = [rawLlmMessage];
        }

        if (reasoningEntry || rawLlmMessage) {
          await updateMessageEntries(updates);
        }
      } catch (error) {
        console.error('[modify-reports] Error updating entries during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
