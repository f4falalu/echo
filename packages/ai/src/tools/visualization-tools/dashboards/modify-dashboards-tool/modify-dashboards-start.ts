import { updateMessageEntries } from '@buster/database';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { createDashboardsReasoningMessage } from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

// Factory function for onInputStart callback
export function createModifyDashboardsStart(
  context: ModifyDashboardsContext,
  state: ModifyDashboardsState
) {
  return wrapTraced(
    async (input: ModifyDashboardsInput) => {
      // Log the start of dashboard modification
      const fileCount = input.files?.length || 0;
      const messageId = context.messageId;

      console.info('[modify-dashboards] Starting dashboard modification', {
        fileCount,
        messageId,
        timestamp: new Date().toISOString(),
      });

      // Initialize state
      state.processingStartTime = Date.now();
      state.toolCallId = `modify-dashboards-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      state.parsedArgs = input;

      // Initialize files in state (with IDs from input)
      state.files = input.files.map((file) => ({
        id: file.id,
        yml_content: file.yml_content,
        status: 'processing' as const,
      }));

      // If we have a messageId, create initial database entries
      if (messageId) {
        try {
          // Create initial reasoning entry
          const reasoningEntry = createDashboardsReasoningMessage(
            state.toolCallId,
            state.files,
            'loading'
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

          // Create all entries at once
          await updateMessageEntries({
            messageId,
            reasoningEntry,
            rawLlmMessage,
            mode: 'append',
          });

          // Store entry IDs for later updates
          state.reasoningEntryId = reasoningEntry.id;

          console.info('[modify-dashboards] Created initial database entries', {
            messageId,
            toolCallId: state.toolCallId,
            reasoningEntryId: state.reasoningEntryId,
            responseEntryId: state.responseEntryId,
          });
        } catch (error) {
          console.error('[modify-dashboards] Failed to create initial database entries', {
            messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    },
    { name: 'modify-dashboards-start' }
  );
}
