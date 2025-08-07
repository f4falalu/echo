import { updateMessageReasoning } from '@buster/database';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type {
  CreateDashboardsAgentContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';
import { createDashboardsReasoningMessage } from './helpers/create-dashboards-tool-transform-helper';

export function createCreateDashboardsFinish<
  TAgentContext extends CreateDashboardsAgentContext = CreateDashboardsAgentContext,
>(context: TAgentContext, state: CreateDashboardsState) {
  return async (input: CreateDashboardsInput) => {
    const fileCount = input.files?.length || 0;
    const fileNames = input.files?.map((f) => f.name) || [];

    // Store complete input in state
    state.parsedArgs = input;

    // Update state files with final data
    state.files = input.files.map((f) => ({
      name: f.name,
      yml_content: f.yml_content,
      status: 'processing' as const,
    }));

    // Update database ONLY if both context.messageId AND state.reasoningEntryId exist
    if (context.messageId && state.reasoningEntryId) {
      try {
        const reasoningMessage = createDashboardsReasoningMessage(
          state.toolCallId || `tool-${Date.now()}`,
          state.files,
          'loading'
        );

        await updateMessageReasoning(
          context.messageId,
          state.reasoningEntryId,
          reasoningMessage as ChatMessageReasoningMessage
        );

        console.info('[create-dashboards] Updated reasoning entry with complete input', {
          messageId: context.messageId,
          reasoningEntryId: state.reasoningEntryId,
          fileCount,
        });
      } catch (error) {
        console.error('[create-dashboards] Error updating reasoning entry on finish:', error);
        // Don't throw - continue processing
      }
    }

    // Log processing time if available
    if (state.processingStartTime) {
      const processingTime = Date.now() - state.processingStartTime;
      console.info('[create-dashboards] Input fully available', {
        fileCount,
        fileNames,
        messageId: context.messageId,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.info('[create-dashboards] Input fully available', {
        fileCount,
        fileNames,
        messageId: context.messageId,
        timestamp: new Date().toISOString(),
      });
    }
  };
}
