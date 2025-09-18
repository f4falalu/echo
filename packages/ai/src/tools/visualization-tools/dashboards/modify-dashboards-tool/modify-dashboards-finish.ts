import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createModifyDashboardsRawLlmMessageEntry,
  createModifyDashboardsReasoningEntry,
} from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

export function createModifyDashboardsFinish(
  context: ModifyDashboardsContext,
  state: ModifyDashboardsState
) {
  return async (options: { input: ModifyDashboardsInput } & ToolCallOptions) => {
    const input = options.input;

    if (input.files) {
      state.files = input.files.map((file, index) => {
        const existingFile = state.files?.[index];
        return {
          id: file.id,
          file_name: existingFile?.file_name,
          file_type: 'dashboard_file',
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
        const reasoningEntry = createModifyDashboardsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createModifyDashboardsRawLlmMessageEntry(state, options.toolCallId);

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
        console.error('[modify-dashboards] Error updating entries on finish:', error);
      }
    }
  };
}
