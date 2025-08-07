import { updateMessageFields } from '@buster/database';
import { createDashboardsReasoningMessage } from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsAgentContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

// Factory function for onInputAvailable callback
export function createModifyDashboardsFinish<
  TAgentContext extends ModifyDashboardsAgentContext = ModifyDashboardsAgentContext,
>(context: TAgentContext, state: ModifyDashboardsState) {
  return async (input: ModifyDashboardsInput) => {
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

    // Update database with final input if we have a messageId and reasoningEntryId
    if (messageId && state.reasoningEntryId) {
      try {
        // Create final reasoning entry
        const reasoningEntry = createDashboardsReasoningMessage(
          state.toolCallId || `modify-dashboards-${Date.now()}`,
          state.files,
          'loading'
        );

        console.info('[modify-dashboards] Updating database with final input', {
          messageId,
          fileCount: state.files.length,
          reasoningEntryId: state.reasoningEntryId,
        });

        // Update database
        await updateMessageFields(messageId, {
          reasoning: [reasoningEntry], // This will update the existing entry with the same ID
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
  };
}
