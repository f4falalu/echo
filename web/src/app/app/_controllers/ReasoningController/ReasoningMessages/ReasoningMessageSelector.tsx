import React from 'react';
import type {
  BusterChatMessageReasoning,
  BusterChatMessageReasoning_text
} from '@/api/asset_interfaces';
import { ReasoningMessage_Thought } from './ReasoningMessage_Thought';
import { StreamingMessage_Text } from '@appComponents/Streaming/StreamingMessage_Text';
import { ReasoningMessage_File } from './ReasoningMessage_File';

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
  thought: ReasoningMessage_Thought,
  text: (props) => (
    <StreamingMessage_Text
      {...props}
      message={(props.reasoningMessage as BusterChatMessageReasoning_text).message}
    />
  ),
  file: ReasoningMessage_File
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
  return (
    <ReasoningMessage
      reasoningMessage={reasoningMessage}
      isCompletedStream={isCompletedStream}
      isLastMessageItem={isLastMessageItem}
      chatId={chatId}
    />
  );
};
