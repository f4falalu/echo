import { updateMessageEntries } from '@buster/database';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import type { DoneToolInput } from '../../communication-tools/done-tool/done-tool';
import type {
  CreateDashboardsContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';
import { createDashboardsReasoningMessage } from './helpers/create-dashboards-tool-transform-helper';

export function createCreateDashboardsFinish(
  context: CreateDashboardsContext,
  state: CreateDashboardsState
) {
  return async (options: { input: CreateDashboardsInput } & ToolCallOptions) => {
    const input = options.input;

    state.parsedArgs = input;

    state.files = input.files.map((f) => ({
      name: f.name,
      yml_content: f.yml_content,
      status: 'processing' as const,
    }));

    // Update database ONLY if both context.messageId AND state.reasoningEntryId exist
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningMessage = createDashboardsReasoningMessage(
          state.toolCallId || `tool-${Date.now()}`,
          state.files,
          'loading'
        );

        await updateMessageEntries({
          messageId: context.messageId,
          responseEntry: reasoningMessage as ChatMessageReasoningMessage,
          mode: 'update',
        });
      } catch (error) {
        console.error('[create-dashboards] Error updating reasoning entry on finish:', error);
      }
    }
  };
}
