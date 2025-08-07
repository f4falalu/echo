import { updateMessageFields } from '@buster/database';
import type {
  CreateMetricsAgentContext,
  CreateMetricsFile,
  CreateMetricsInput,
  CreateMetricsState,
} from './create-metrics-tool';
import {
  createMetricsReasoningMessage,
  extractMetricsFileInfo,
} from './helpers/create-metrics-transform-helper';

// Factory function for onInputAvailable callback
export function createCreateMetricsFinish<
  TAgentContext extends CreateMetricsAgentContext = CreateMetricsAgentContext,
>(context: TAgentContext, state: CreateMetricsState) {
  return async (input: CreateMetricsInput) => {
    // Log when input is fully available
    const fileCount = input.files?.length || 0;
    const messageId = context.messageId;
    const fileNames = input.files?.map((f) => f.name) || [];

    console.info('[create-metrics] Input fully available', {
      fileCount,
      fileNames,
      messageId,
      timestamp: new Date().toISOString(),
    });

    // Ensure state has complete input
    state.parsedArgs = input;

    // Update files to ensure we have everything
    if (input.files) {
      state.files = input.files.map((file, index) => {
        const existingFile = state.files[index];
        const newFile: CreateMetricsFile = {
          name: file.name,
          yml_content: file.yml_content,
          status: existingFile?.status || ('processing' as const),
        };

        // Only add optional properties if they have values
        if (existingFile?.id) newFile.id = existingFile.id;
        if (existingFile?.version) newFile.version = existingFile.version;
        if (existingFile?.error) newFile.error = existingFile.error;

        return newFile;
      });
    }

    // If we have a messageId, prepare for final updates
    if (messageId && state.reasoningEntryId) {
      try {
        // Mark files as ready for processing
        state.files.forEach((file) => {
          if (!file.status || file.status === 'processing') {
            file.status = 'processing'; // Will be updated to completed/failed by execute
          }
        });

        // Create updated reasoning entry
        const reasoningEntry = createMetricsReasoningMessage(
          state.toolCallId || `create-metrics-${Date.now()}`,
          state.files,
          'loading' // Still loading, execute will mark as completed
        );

        // Calculate processing time
        const processingTime = state.processingStartTime
          ? Date.now() - state.processingStartTime
          : undefined;

        console.info('[create-metrics] Finalizing streaming data', {
          messageId,
          fileCount: state.files.length,
          processingTime,
          toolCallId: state.toolCallId,
        });

        // Update database with final streaming state
        await updateMessageFields(messageId, {
          reasoning: [reasoningEntry], // Update existing entry
        });
      } catch (error) {
        console.error('[create-metrics] Failed to finalize streaming data', {
          messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
