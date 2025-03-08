import React from 'react';
import type { BusterChatMessageReasoning_pills } from '@/api/asset_interfaces';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { useMessageIndividual } from '@/context/Chats';
import { ReasoningMessagePillsContainer } from './ReasoningMessagePillsContainer';

export const ReasoningMessage_PillsContainer: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isCompletedStream, animationKey }) => {
    const reasoningMessage = useMessageIndividual(
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
        animationKey={animationKey}
      />
    );
  }
);

ReasoningMessage_PillsContainer.displayName = 'ReasoningMessage_PillsContainer';
