import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import type {
  CreateReportsContext,
  CreateReportsInput,
  CreateReportsState,
} from './create-reports-tool';
import {
  createCreateReportsRawLlmMessageEntry,
  createCreateReportsReasoningEntry,
} from './helpers/create-reports-tool-transform-helper';

export function createCreateReportsFinish(
  context: CreateReportsContext,
  state: CreateReportsState
) {
  return async (options: { input: CreateReportsInput } & ToolCallOptions) => {
    const input = options.input;

    // Process final input for single report
    if (input.name && input.content) {
      // Initialize state file if needed
      const existingFile = state.file;

      // Set final state for the single report
      state.file = {
        id: existingFile?.id || randomUUID(),
        file_name: input.name,
        file_type: 'report_file',
        version_number: existingFile?.version_number || 1,
        file: {
          text: input.content,
        },
        status: existingFile?.status || 'loading',
      };
    }

    // Update database with final state
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createCreateReportsReasoningEntry(state, state.toolCallId);
        const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, state.toolCallId);

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

        console.info('[create-reports] Finished input processing', {
          messageId: context.messageId,
          reportCreated: !!state.file,
        });
      } catch (error) {
        console.error('[create-reports] Error updating entries on finish:', error);
      }
    }
  };
}
