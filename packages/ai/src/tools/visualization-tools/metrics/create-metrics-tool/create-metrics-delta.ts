import { updateMessageEntries } from '@buster/database';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../../utils/streaming/optimistic-json-parser';
import type {
  CreateMetricsContext,
  CreateMetricsFile,
  CreateMetricsState,
} from './create-metrics-tool';
import {
  CREATE_METRICS_KEYS,
  createMetricsReasoningMessage,
  updateMetricsProgressMessage,
} from './helpers/create-metrics-transform-helper';

// Factory function for onInputDelta callback
export function createCreateMetricsDelta(context: CreateMetricsContext, state: CreateMetricsState) {
  return async function createMetricsDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Accumulate the delta to the args
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText);

    // Extract files array from optimistic parsing - type-safe key
    const filesArray = getOptimisticValue<unknown[]>(
      parseResult.extractedValues,
      CREATE_METRICS_KEYS.files
    );

    if (filesArray && Array.isArray(filesArray)) {
      // Initialize files array if not already initialized
      if (!state.files) {
        state.files = [];
      }

      // Track if state changed to avoid unnecessary database updates
      let stateChanged = false;

      // Update state files with streaming data
      filesArray.forEach((file, index) => {
        if (file && typeof file === 'object') {
          const hasName = CREATE_METRICS_KEYS.name in file && file[CREATE_METRICS_KEYS.name];
          const hasContent =
            CREATE_METRICS_KEYS.yml_content in file && file[CREATE_METRICS_KEYS.yml_content];

          // Update or add file when we have both name and content
          if (hasName && hasContent) {
            const name = file[CREATE_METRICS_KEYS.name] as string;
            const ymlContent = file[CREATE_METRICS_KEYS.yml_content] as string;

            // Check if file already exists in state
            const existingFile = state.files?.[index];
            if (existingFile) {
              // Only update if values changed
              if (existingFile.name !== name || existingFile.yml_content !== ymlContent) {
                existingFile.name = name;
                existingFile.yml_content = ymlContent;
                stateChanged = true;
              }
            } else {
              // Add new file
              if (state.files) {
                state.files[index] = {
                  name,
                  yml_content: ymlContent,
                  status: 'processing',
                };
                stateChanged = true;
              }
            }
          } else if (hasName && !state.files?.[index]) {
            // Add placeholder with just name
            if (state.files) {
              state.files[index] = {
                name: file[CREATE_METRICS_KEYS.name] as string,
                yml_content: '',
                status: 'processing',
              };
              stateChanged = true;
            }
          }
        }
      });

      // Update database with progress if state changed and we have a messageId
      if (stateChanged && context.messageId && state.files) {
        try {
          // Filter out any undefined entries
          const validFiles = state.files.filter((f): f is CreateMetricsFile => f !== undefined);

          // Create updated reasoning entry
          const reasoningEntry = createMetricsReasoningMessage(
            state.toolCallId || options.toolCallId,
            validFiles,
            'loading'
          );

          // Get progress message
          const progressMessage = updateMetricsProgressMessage(validFiles);

          console.info('[create-metrics] Updating database with streaming progress', {
            messageId: context.messageId,
            progressMessage,
            fileCount: validFiles.length,
            processedCount: validFiles.filter((f) => f.yml_content).length,
          });

          // Update database with streaming progress
          await updateMessageEntries({
            messageId: context.messageId,
            reasoningEntry: reasoningEntry as ChatMessageReasoningMessage,
            mode: 'update',
          });
        } catch (error) {
          console.error('[create-metrics] Failed to update streaming progress', {
            messageId: context.messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  };
}
