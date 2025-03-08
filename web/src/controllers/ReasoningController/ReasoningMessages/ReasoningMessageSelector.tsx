import React from 'react';
import type { BusterChatMessageReasoning } from '@/api/asset_interfaces';
import { ReasoningMessage_PillsContainer } from './ReasoningMessage_PillContainers';
import { ReasoningMessage_Files } from './ReasoningMessage_Files';
import { ReasoningMessage_Text } from './ReasoningMessage_Text';
import { useMessageIndividual } from '@/context/Chats';

export interface ReasoningMessageProps {
  reasoningMessageId: string;
  messageId: string;
  isCompletedStream: boolean;
  chatId: string;
  animationKey?: string;
}

const ReasoningMessageRecord: Record<
  BusterChatMessageReasoning['type'],
  React.FC<ReasoningMessageProps>
> = {
  pills: ReasoningMessage_PillsContainer,
  text: ReasoningMessage_Text,
  files: ReasoningMessage_Files
};

export interface ReasoningMessageSelectorProps {
  reasoningMessageId: string;
  messageId: string;
  isCompletedStream: boolean;
  chatId: string;
}

export const ReasoningMessageSelector: React.FC<ReasoningMessageSelectorProps> = ({
  reasoningMessageId,
  isCompletedStream,
  chatId,
  messageId
}) => {
  const reasoningMessageType = useMessageIndividual(
    messageId,
    (x) => x?.reasoning_messages[reasoningMessageId]?.type
  );

  if (!reasoningMessageType) return null;

  const ReasoningMessage = ReasoningMessageRecord[reasoningMessageType];

  return (
    <ReasoningMessage
      key={reasoningMessageId} //force in case the type changes
      animationKey={reasoningMessageId + reasoningMessageType}
      reasoningMessageId={reasoningMessageId}
      isCompletedStream={isCompletedStream}
      messageId={messageId}
      chatId={chatId}
    />
  );
};
