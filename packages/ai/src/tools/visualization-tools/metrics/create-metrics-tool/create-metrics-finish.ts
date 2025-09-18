import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import type {
  CreateMetricsContext,
  CreateMetricsInput,
  CreateMetricsState,
} from './create-metrics-tool';
import {
  createCreateMetricsRawLlmMessageEntry,
  createCreateMetricsReasoningEntry,
} from './helpers/create-metrics-transform-helper';

export function createCreateMetricsFinish(
  context: CreateMetricsContext,
  state: CreateMetricsState
) {
  return async (options: { input: CreateMetricsInput } & ToolCallOptions) => {
    const input = options.input;

    if (input.files) {
      state.files = input.files.map((file, index) => {
        const existingFile = state.files?.[index];
        return {
          id: existingFile?.id || randomUUID(),
          file_name: file.name,
          file_type: 'metric_file',
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
        const reasoningEntry = createCreateMetricsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createCreateMetricsRawLlmMessageEntry(state, options.toolCallId);

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
        console.error('[create-metrics] Error updating entries on finish:', error);
      }
    }
  };
}
