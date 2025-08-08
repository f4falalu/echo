import { updateMessageEntries } from '@buster/database';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import {
  createDashboardsReasoningMessage,
  createDashboardsResponseMessage,
} from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

// Factory function for onInputAvailable callback
export function createModifyDashboardsFinish(
  context: ModifyDashboardsContext,
  state: ModifyDashboardsState
) {
  return wrapTraced(
    async (input: ModifyDashboardsInput) => {
      const fileCount = input.files?.length || 0;
      const messageId = context.messageId;
      const fileIds = input.files?.map((f) => f.id) || [];

      console.info('[modify-dashboards] Input fully available', {
        fileCount,
        fileIds,
        messageId,
        timestamp: new Date().toISOString(),
      });

      // Store complete input in state
      state.parsedArgs = input;

      // Update files with final data
      state.files = input.files.map((file) => ({
        id: file.id,
        yml_content: file.yml_content,
        status: 'processing' as const,
      }));

      // Update database with final input if we have a messageId
      if (messageId && state.toolCallId) {
        try {
          // Create final reasoning entry
          const reasoningEntry = createDashboardsReasoningMessage(
            state.toolCallId,
            state.files,
            'loading'
          );

          // Create response entry
          const responseEntry = createDashboardsResponseMessage(
            state.toolCallId,
            'Processing dashboard modifications...'
          );

          // Create raw LLM message
          const rawLlmMessage: ModelMessage = {
            role: 'assistant',
            content: [
              {
                type: 'tool-call',
                toolCallId: state.toolCallId,
                toolName: 'modify-dashboards',
                input,
              },
            ],
          };

          console.info('[modify-dashboards] Updating database with final input', {
            messageId,
            fileCount: state.files.length,
            toolCallId: state.toolCallId,
          });

          // Update entries with final input
          await updateMessageEntries({
            messageId,
            reasoningEntry,
            responseEntry,
            rawLlmMessage,
            mode: 'update',
          });
        } catch (error) {
          console.error('[modify-dashboards] Failed to update with final input', {
            messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Don't throw - let execution continue
        }
      }

      // Log processing time if available
      if (state.processingStartTime) {
        const duration = Date.now() - state.processingStartTime;
        console.info('[modify-dashboards] Input processing duration', {
          duration,
          messageId,
        });
      }
    },
    { name: 'modify-dashboards-finish' }
  );
}
