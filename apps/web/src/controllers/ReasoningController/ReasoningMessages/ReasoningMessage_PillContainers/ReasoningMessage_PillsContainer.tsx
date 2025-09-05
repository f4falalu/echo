import React, { useCallback } from 'react';
import type {
  BusterChatMessage,
  BusterChatMessageReasoning_pills,
} from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { ReasoningMessagePillsContainer } from './ReasoningMessagePillsContainer';

export const ReasoningMessage_PillsContainer: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isStreamFinished, chatId }) => {
    const { data: reasoningMessage } = useGetChatMessage(messageId, {
      select: useCallback(
        (x: BusterChatMessage) => x?.reasoning_messages[reasoningMessageId],
        [reasoningMessageId]
      ),
    });

    const reasoningMessagePills = reasoningMessage as BusterChatMessageReasoning_pills;

    return (
      <ReasoningMessagePillsContainer
        {...reasoningMessagePills}
        isStreamFinished={isStreamFinished}
        chatId={chatId}
      />
    );
  }
);

ReasoningMessage_PillsContainer.displayName = 'ReasoningMessage_PillsContainer';
