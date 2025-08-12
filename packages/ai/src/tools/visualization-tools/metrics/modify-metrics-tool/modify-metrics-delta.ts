import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../../utils/streaming/optimistic-json-parser';
import {
  createModifyMetricsRawLlmMessageEntry,
  createModifyMetricsReasoningEntry,
} from './helpers/modify-metrics-tool-transform-helper';
import type {
  ModifyMetricStateFile,
  ModifyMetricsContext,
  ModifyMetricsState,
} from './modify-metrics-tool';

// Define TOOL_KEYS locally
const TOOL_KEYS = {
  files: 'files' as const,
  id: 'id' as const,
  yml_content: 'yml_content' as const,
};

export function createModifyMetricsDelta(context: ModifyMetricsContext, state: ModifyMetricsState) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Try to parse the accumulated JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText || '');

    if (parseResult.parsed) {
      // Extract files array from parsed result
      const filesArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        TOOL_KEYS.files,
        []
      );

      if (filesArray && Array.isArray(filesArray)) {
        // Update state files with streamed data
        const updatedFiles: ModifyMetricStateFile[] = [];

        filesArray.forEach((file, index) => {
          if (file && typeof file === 'object') {
            const fileObj = file as Record<string, unknown>;
            const id = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.id,
              ''
            );
            const ymlContent = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.yml_content,
              ''
            );

            // Only add files that have at least an ID
            if (id) {
              // Check if this file already exists in state to preserve data
              const existingFile = state.files?.[index];

              updatedFiles.push({
                id: existingFile?.id || id,
                file_name: existingFile?.file_name,
                file_type: 'metric',
                version_number: existingFile?.version_number || 1,
                file: ymlContent
                  ? {
                      text: ymlContent,
                    }
                  : undefined,
                yml_content: ymlContent || undefined,
                status: 'loading',
              });
            }
          }
        });

        state.files = updatedFiles;
      }
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createModifyMetricsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createModifyMetricsRawLlmMessageEntry(state, options.toolCallId);

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
        console.error('[modify-metrics] Error updating entries during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
