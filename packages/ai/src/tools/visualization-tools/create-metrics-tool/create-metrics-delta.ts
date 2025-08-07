import { updateMessageFields } from '@buster/database';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import type {
  CreateMetricsAgentContext,
  CreateMetricsInput,
  CreateMetricsState,
} from './create-metrics-tool';
import {
  CREATE_METRICS_KEYS,
  createMetricsReasoningMessage,
  updateMetricsProgressMessage,
} from './helpers/create-metrics-transform-helper';

// Factory function for onInputDelta callback
export function createCreateMetricsDelta<
  TAgentContext extends CreateMetricsAgentContext = CreateMetricsAgentContext,
>(context: TAgentContext, state: CreateMetricsState) {
  return async (delta: string | Partial<CreateMetricsInput>) => {
    const messageId = context.messageId;

    // Handle string deltas (streaming JSON)
    if (typeof delta === 'string') {
      state.argsText += delta;

      // Use optimistic parsing to extract values even from incomplete JSON
      const parseResult = OptimisticJsonParser.parse(state.argsText);

      // Update parsed args
      if (parseResult.parsed) {
        state.parsedArgs = parseResult.parsed as Partial<CreateMetricsInput>;
      }

      // Extract files array from optimistic parsing
      const filesArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        CREATE_METRICS_KEYS.files,
        []
      );

      if (filesArray && Array.isArray(filesArray)) {
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
              if (state.files[index]) {
                // Update existing file
                state.files[index].name = name;
                state.files[index].yml_content = ymlContent;
              } else {
                // Add new file
                state.files[index] = {
                  name,
                  yml_content: ymlContent,
                  status: 'processing',
                };
              }
            } else if (hasName && !state.files[index]) {
              // Add placeholder with just name
              state.files[index] = {
                name: file[CREATE_METRICS_KEYS.name] as string,
                yml_content: '',
                status: 'processing',
              };
            }
          }
        });

        // Update database with progress if we have a messageId
        if (messageId && state.reasoningEntryId) {
          try {
            // Create updated reasoning entry
            const reasoningEntry = createMetricsReasoningMessage(
              state.toolCallId || `create-metrics-${Date.now()}`,
              state.files.filter((f) => f), // Filter out any undefined entries
              'loading'
            );

            // Get progress message (filter out undefined entries)
            const progressMessage = updateMetricsProgressMessage(state.files.filter((f) => f));

            console.info('[create-metrics] Updating database with streaming progress', {
              messageId,
              progressMessage,
              fileCount: state.files.filter((f) => f).length,
              processedCount: state.files.filter((f) => f?.yml_content).length,
            });

            // Update database with append mode for streaming
            await updateMessageFields(messageId, {
              reasoning: [reasoningEntry], // This will update the existing entry with the same ID
            });
          } catch (error) {
            console.error('[create-metrics] Failed to update streaming progress', {
              messageId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    } else {
      // Handle object deltas (complete input)
      if (delta.files) {
        state.parsedArgs = delta;
        state.files = delta.files.map((file) => ({
          name: file.name,
          yml_content: file.yml_content,
          status: 'processing' as const,
        }));
      }
    }

    console.info('[create-metrics] Input delta processed', {
      hasFiles: !!state.files.filter((f) => f).length,
      fileCount: state.files.filter((f) => f).length,
      processedCount: state.files.filter((f) => f?.yml_content).length,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
