import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type {
  CreateDashboardsContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';
import {
  createCreateDashboardsRawLlmMessageEntry,
  createCreateDashboardsReasoningEntry,
} from './helpers/create-dashboards-tool-transform-helper';

export function createCreateDashboardsFinish(
  context: CreateDashboardsContext,
  state: CreateDashboardsState
) {
  return async (options: { input: CreateDashboardsInput } & ToolCallOptions) => {
    const input = options.input;

    if (input.files) {
      state.files = input.files.map((file, index) => {
        const existingFile = state.files?.[index];
        return {
          id: existingFile?.id || randomUUID(),
          file_name: file.name,
          file_type: 'dashboard',
          version_number: existingFile?.version_number || 1,
          file: {
            text: file.yml_content,
          },
          status: existingFile?.status || 'loading',
        };
      });
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createCreateDashboardsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createCreateDashboardsRawLlmMessageEntry(state, options.toolCallId);

        // Update both entries together if they exist
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
      } catch (error) {
        console.error('[create-dashboards] Error updating entries on finish:', error);
      }
    }
  };
}
