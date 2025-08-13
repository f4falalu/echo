import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createModifyMetricsRawLlmMessageEntry,
  createModifyMetricsReasoningEntry,
} from './helpers/modify-metrics-tool-transform-helper';
import type {
  ModifyMetricsContext,
  ModifyMetricsInput,
  ModifyMetricsState,
} from './modify-metrics-tool';

export function createModifyMetricsFinish(
  context: ModifyMetricsContext,
  state: ModifyMetricsState
) {
  return async (options: { input: ModifyMetricsInput } & ToolCallOptions) => {
    const input = options.input;

    if (input.files) {
      state.files = input.files.map((file, index) => {
        const existingFile = state.files?.[index];
        return {
          id: file.id,
          file_name: existingFile?.file_name,
          file_type: 'metric',
          version_number: existingFile?.version_number || 1,
          file: {
            text: file.yml_content,
          },
          yml_content: file.yml_content,
          status: existingFile?.status || 'loading',
        };
      });
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createModifyMetricsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createModifyMetricsRawLlmMessageEntry(state, options.toolCallId);

        // Update both entries together if they exist
        const updates: Parameters<typeof updateMessageEntries>[0] = {
          messageId: context.messageId,
          toolCallId: options.toolCallId,
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
        console.error('[modify-metrics] Error updating entries on finish:', error);
      }
    }
  };
}
