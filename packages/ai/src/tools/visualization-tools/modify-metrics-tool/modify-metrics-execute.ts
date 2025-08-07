import { updateMessageFields } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { createModifyMetricsReasoningMessage } from './helpers/modify-metrics-tool-transform-helper';
import type {
  ModifyMetricsAgentContext,
  ModifyMetricsInput,
  ModifyMetricsOutput,
  ModifyMetricsState,
} from './modify-metrics-tool';

// For now, import and use the existing implementation
import { modifyMetrics as existingModifyMetrics } from '../modify-metrics-file-tool';

export function createModifyMetricsExecute<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext, state: ModifyMetricsState) {
  return wrapTraced(
    async (input: ModifyMetricsInput): Promise<ModifyMetricsOutput> => {
      const startTime = Date.now();
      const messageId = context?.messageId;

      try {
        // Delegate to existing tool with context wrapped in experimental_context
        const result = await existingModifyMetrics.execute(input, {
          experimental_context: context,
        });

        // Update state files with results
        if (result.files && Array.isArray(result.files)) {
          result.files.forEach((file) => {
            const stateFile = state.files.find((f) => f.id === file.id);
            if (stateFile) {
              stateFile.status = 'completed';
              stateFile.name = file.name;
              stateFile.version = file.version_number;
            }
          });
        }

        // Handle failed files
        if (result.failed_files && Array.isArray(result.failed_files)) {
          result.failed_files.forEach((failedFile) => {
            // Try to match by name since failed files might not have IDs
            const stateFile = state.files.find((f) => f.name === failedFile.file_name);
            if (stateFile) {
              stateFile.status = 'failed';
              stateFile.error = failedFile.error;
            }
          });
        }

        // Create final reasoning entry if messageId exists
        if (messageId && state.reasoningEntryId) {
          try {
            const finalStatus = result.failed_files?.length > 0 ? 'completed' : 'completed';
            const reasoningEntry = createModifyMetricsReasoningMessage(
              state.toolCallId || `modify-metrics-${Date.now()}`,
              state.files,
              finalStatus
            );

            console.info('[modify-metrics] Updating database with execution results', {
              messageId,
              successCount: result.files?.length || 0,
              failedCount: result.failed_files?.length || 0,
              executionTime: Date.now() - startTime,
            });

            await updateMessageFields(messageId, {
              reasoning: [reasoningEntry],
            });
          } catch (error) {
            console.error('[modify-metrics] Failed to update database with execution results', {
              messageId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        return result as ModifyMetricsOutput;
      } catch (error) {
        // Update all files as failed if execution throws
        state.files.forEach((file) => {
          file.status = 'failed';
          file.error = error instanceof Error ? error.message : 'Unknown error';
        });

        // Update database with failure status
        if (messageId && state.reasoningEntryId) {
          try {
            const reasoningEntry = createModifyMetricsReasoningMessage(
              state.toolCallId || `modify-metrics-${Date.now()}`,
              state.files,
              'failed'
            );

            await updateMessageFields(messageId, {
              reasoning: [reasoningEntry],
            });
          } catch (dbError) {
            console.error('[modify-metrics] Failed to update database with error status', {
              messageId,
              error: dbError instanceof Error ? dbError.message : 'Unknown error',
            });
          }
        }

        throw error;
      }
    },
    { name: 'modify-metrics-execute' }
  );
}
