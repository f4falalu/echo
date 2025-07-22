import React from 'react';
import type { BusterChatMessageReasoning_pills } from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { ReasoningMessagePillsContainer } from './ReasoningMessagePillsContainer';

export const ReasoningMessage_PillsContainer: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isStreamFinished, chatId }) => {
    const { data: reasoningMessage } = useGetChatMessage(messageId, {
      select: (x) => x?.reasoning_messages[reasoningMessageId]
    });

    const reasoningMessagePills = reasoningMessage as BusterChatMessageReasoning_pills;
    const { status } = reasoningMessagePills;

    return (
      <ReasoningMessagePillsContainer
        {...reasoningMessagePills}
        status={status}
        isStreamFinished={isStreamFinished}
        chatId={chatId}
      />
    );
  }
);

ReasoningMessage_PillsContainer.displayName = 'ReasoningMessage_PillsContainer';
