import React from 'react';
import type { BusterChatMessageReasoning } from '@/api/asset_interfaces';
import { ReasoningMessage_PillsContainer } from './ReasoningMessage_PillContainers';
import { ReasoningMessage_Files } from './ReasoningMessage_Files';
import { ReasoningMessage_Text } from './ReasoningMessage_Text';

export interface ReasoningMessageProps {
  reasoningMessage: BusterChatMessageReasoning;
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
  chatId: string;
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
  reasoningMessage: BusterChatMessageReasoning;
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
  chatId: string;
}

export const ReasoningMessageSelector: React.FC<ReasoningMessageSelectorProps> = ({
  reasoningMessage,
  isCompletedStream,
  isLastMessageItem,
  chatId
}) => {
  const ReasoningMessage = ReasoningMessageRecord[reasoningMessage.type];
  console.log(reasoningMessage.type);
  return (
    <ReasoningMessage
      reasoningMessage={reasoningMessage}
      isCompletedStream={isCompletedStream}
      isLastMessageItem={isLastMessageItem}
      chatId={chatId}
    />
  );
};
