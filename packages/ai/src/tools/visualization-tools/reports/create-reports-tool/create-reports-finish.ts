import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database';
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

    // Process final input
    if (input.files) {
      // Initialize state files if needed
      if (!state.files) {
        state.files = [];
      }

      // Set final state for all files
      state.files = input.files.map((file, index) => {
        const existingFile = state.files?.[index];
        return {
          id: existingFile?.id || randomUUID(),
          file_name: file.name,
          file_type: 'report',
          version_number: existingFile?.version_number || 1,
          file: {
            text: file.content,
          },
          status: existingFile?.status || 'loading',
        };
      });
    }

    // Update database with final state
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createCreateReportsReasoningEntry(state, state.toolCallId);
        const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, state.toolCallId);

        const updates: Parameters<typeof updateMessageEntries>[0] = {
          messageId: context.messageId,
          mode: 'update',
        };

        if (reasoningEntry) {
          updates.responseEntry = reasoningEntry;
        }

        if (rawLlmMessage) {
          updates.rawLlmMessage = rawLlmMessage;
        }

        if (reasoningEntry || rawLlmMessage) {
          await updateMessageEntries(updates);
        }

        console.info('[create-reports] Finished input processing', {
          messageId: context.messageId,
          fileCount: state.files?.length || 0,
        });
      } catch (error) {
        console.error('[create-reports] Error updating entries on finish:', error);
      }
    }
  };
}
