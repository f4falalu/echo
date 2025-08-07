import { updateMessageFields } from '@buster/database';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import {
  MODIFY_METRICS_KEYS,
  createModifyMetricsReasoningMessage,
  updateModifyMetricsProgressMessage,
} from './helpers/modify-metrics-tool-transform-helper';
import type {
  ModifyMetricsAgentContext,
  ModifyMetricsInput,
  ModifyMetricsState,
} from './modify-metrics-tool';

export function createModifyMetricsDelta<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext, state: ModifyMetricsState) {
  return async (delta: string | Partial<ModifyMetricsInput>) => {
    const messageId = context.messageId;

    // Handle string deltas (streaming JSON)
    if (typeof delta === 'string') {
      state.argsText += delta;

      // Use optimistic parsing to extract values even from incomplete JSON
      const parseResult = OptimisticJsonParser.parse(state.argsText);

      // Update parsed args
      if (parseResult.parsed) {
        state.parsedArgs = parseResult.parsed as Partial<ModifyMetricsInput>;
      }

      // Extract files array from optimistic parsing
      const filesArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        MODIFY_METRICS_KEYS.files,
        []
      );

      if (filesArray && Array.isArray(filesArray)) {
        // Update state files with streaming data
        filesArray.forEach((file, index) => {
          if (file && typeof file === 'object') {
            const hasId = MODIFY_METRICS_KEYS.id in file && file[MODIFY_METRICS_KEYS.id];
            const hasContent =
              MODIFY_METRICS_KEYS.yml_content in file && file[MODIFY_METRICS_KEYS.yml_content];

            // Get name from file if available
            const hasName = MODIFY_METRICS_KEYS.name in file && file[MODIFY_METRICS_KEYS.name];

            // Update or add file when we have both id and content
            if (hasId && hasContent) {
              const id = file[MODIFY_METRICS_KEYS.id] as string;
              const ymlContent = file[MODIFY_METRICS_KEYS.yml_content] as string;
              const name = hasName ? (file[MODIFY_METRICS_KEYS.name] as string) : undefined;

              // Check if file already exists in state
              if (state.files[index]) {
                // Update existing file
                state.files[index].id = id;
                state.files[index].yml_content = ymlContent;
                if (name) {
                  state.files[index].name = name;
                }
              } else {
                // Add new file
                state.files[index] = {
                  id,
                  yml_content: ymlContent,
                  name,
                  status: 'processing',
                };
              }
            } else if (hasId && !state.files[index]) {
              // Add placeholder with just id
              state.files[index] = {
                id: file[MODIFY_METRICS_KEYS.id] as string,
                yml_content: '',
                name: hasName ? (file[MODIFY_METRICS_KEYS.name] as string) : undefined,
                status: 'processing',
              };
            }
          }
        });

        // Update database with progress if we have both messageId and reasoningEntryId
        if (messageId && state.reasoningEntryId) {
          try {
            // Filter out undefined entries before creating reasoning message
            const validFiles = state.files.filter((f) => f);

            // Create updated reasoning entry
            const reasoningEntry = createModifyMetricsReasoningMessage(
              state.toolCallId || `modify-metrics-${Date.now()}`,
              validFiles,
              'loading'
            );

            // Get progress message
            const progressMessage = updateModifyMetricsProgressMessage(validFiles);

            console.info('[modify-metrics] Updating database with streaming progress', {
              messageId,
              progressMessage,
              fileCount: validFiles.length,
              processedCount: validFiles.filter((f) => f?.yml_content).length,
            });

            // Update database with append mode for streaming
            await updateMessageFields(messageId, {
              reasoning: [reasoningEntry], // This will update the existing entry with the same ID
            });
          } catch (error) {
            console.error('[modify-metrics] Failed to update streaming progress', {
              messageId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Continue processing even if database update fails
          }
        }
      }
    } else {
      // Handle object deltas (complete input)
      if (delta.files) {
        state.parsedArgs = delta;
        state.files = delta.files.map((file) => ({
          id: file.id,
          yml_content: file.yml_content,
          status: 'processing' as const,
        }));
      }
    }

    console.info('[modify-metrics] Input delta processed', {
      hasFiles: !!state.files.filter((f) => f).length,
      fileCount: state.files.filter((f) => f).length,
      processedCount: state.files.filter((f) => f?.yml_content).length,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
