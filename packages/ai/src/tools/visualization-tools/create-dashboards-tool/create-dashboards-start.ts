import { insertMessageReasoning } from '@buster/database';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type {
  CreateDashboardsAgentContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';
import { createDashboardsReasoningMessage } from './helpers/create-dashboards-tool-transform-helper';

export function createCreateDashboardsStart<
  TAgentContext extends CreateDashboardsAgentContext = CreateDashboardsAgentContext,
>(context: TAgentContext, state: CreateDashboardsState) {
  return async (_input: CreateDashboardsInput) => {
    const fileCount = _input.files?.length || 0;

    // Initialize state
    state.processingStartTime = Date.now();
    state.toolCallId = `tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.info('[create-dashboards] Starting dashboard creation', {
      fileCount,
      messageId: context.messageId,
      toolCallId: state.toolCallId,
      timestamp: new Date().toISOString(),
    });

    // Create initial database entries ONLY if context.messageId exists
    if (context.messageId) {
      try {
        // Create initial reasoning entry with empty files
        const initialReasoningMessage = createDashboardsReasoningMessage(
          state.toolCallId || `tool-${Date.now()}`,
          [],
          'loading'
        );

        const reasoningEntry = await insertMessageReasoning(
          context.messageId,
          initialReasoningMessage as ChatMessageReasoningMessage
        );

        // Store the reasoning entry ID for later updates
        state.reasoningEntryId = reasoningEntry.id;

        console.info('[create-dashboards] Created initial reasoning entry', {
          messageId: context.messageId,
          reasoningEntryId: state.reasoningEntryId,
        });
      } catch (error) {
        console.error('[create-dashboards] Error creating initial database entries:', error);
        // Don't throw - continue processing even if database write fails
      }
    }
  };
}
