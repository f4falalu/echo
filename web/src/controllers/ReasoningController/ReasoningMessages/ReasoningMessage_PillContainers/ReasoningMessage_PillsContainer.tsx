import React from 'react';
import type { BusterChatMessageReasoning_pills } from '@/api/asset_interfaces';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { ReasoningMessagePillsContainer } from './ReasoningMessagePillsContainer';

export const ReasoningMessage_PillsContainer: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isCompletedStream }) => {
    const reasoningMessage = useGetChatMessage(
      messageId,
      (x) => x?.reasoning_messages[reasoningMessageId]
    )!;

    const reasoningMessagePills = reasoningMessage as BusterChatMessageReasoning_pills;
    const { status } = reasoningMessagePills;

    return (
      <ReasoningMessagePillsContainer
        {...reasoningMessagePills}
        status={status}
        isCompletedStream={isCompletedStream}
      />
    );
  }
);

ReasoningMessage_PillsContainer.displayName = 'ReasoningMessage_PillsContainer';
