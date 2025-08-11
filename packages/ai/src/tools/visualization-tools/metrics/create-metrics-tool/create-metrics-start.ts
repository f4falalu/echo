import { updateMessageEntries } from '@buster/database';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import type { CreateMetricsContext, CreateMetricsState } from './create-metrics-tool';
import { createMetricsReasoningMessage } from './helpers/create-metrics-transform-helper';

export function createCreateMetricsStart(context: CreateMetricsContext, state: CreateMetricsState) {
  return async function createMetricsStart(options: ToolCallOptions): Promise<void> {
    state.toolCallId = options.toolCallId;

    if (context.messageId) {
      try {
        const initialReasoningMessage = createMetricsReasoningMessage(
          state.toolCallId || `tool-${Date.now()}`,
          [],
          'loading'
        );

        await updateMessageEntries({
          messageId: context.messageId,
          responseEntry: initialReasoningMessage as ChatMessageReasoningMessage,
          mode: 'append',
        });
      } catch (error) {
        console.error('[create-metrics] Error creating initial database entries:', error);
      }
    }
  };
}
