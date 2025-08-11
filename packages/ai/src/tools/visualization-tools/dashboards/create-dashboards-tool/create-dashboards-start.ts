import { updateMessageEntries } from '@buster/database';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import type {
  CreateDashboardsContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';
import { createDashboardsReasoningMessage } from './helpers/create-dashboards-tool-transform-helper';

export function createDashboardsStart(
  context: CreateDashboardsContext,
  state: CreateDashboardsState
) {
  return async (options: ToolCallOptions) => {
    state.toolCallId = options.toolCallId;

    if (context.messageId) {
      try {
        const initialReasoningMessage = createDashboardsReasoningMessage(
          state.toolCallId || `tool-${Date.now()}`,
          [],
          'loading'
        );

        const 

        await updateMessageEntries({
          messageId: context.messageId,
          responseEntry: initialReasoningMessage as ChatMessageReasoningMessage,
          mode: 'append',
        });
      } catch (error) {
        console.error('[create-dashboards] Error creating initial database entries:', error);
      }
    }
  };
}
