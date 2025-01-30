import React from 'react';
import { ChatResponseMessage_File } from './ChatResponseMessage_File';
import { ChatResponseMessage_Text } from './ChatResponseMessage_Text';
import { ChatResponseMessage_Thought } from './ChatResponseMessage_Thought';
import type { BusterChatMessageResponse } from '@/api/buster_socket/chats';
import { ChatResponseMessageHidden } from './ChatResponseMessageHidden';

export interface ChatResponseMessageProps {
  responseMessage: BusterChatMessageResponse;
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
}

const ChatResponseMessageRecord: Record<
  BusterChatMessageResponse['type'],
  React.FC<ChatResponseMessageProps>
> = {
  text: ChatResponseMessage_Text,
  file: ChatResponseMessage_File,
  thought: ChatResponseMessage_Thought
};

export interface ChatResponseMessageSelectorProps {
  responseMessage: BusterChatMessageResponse | BusterChatMessageResponse[];
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
}

export const ChatResponseMessageSelector: React.FC<ChatResponseMessageSelectorProps> = ({
  responseMessage,
  isCompletedStream,
  isLastMessageItem
}) => {
  if (Array.isArray(responseMessage)) {
    return (
      <ChatResponseMessageHidden
        hiddenItems={responseMessage}
        isCompletedStream={isCompletedStream}
      />
    );
  }

  const ChatResponseMessage = ChatResponseMessageRecord[responseMessage.type];
  return (
    <ChatResponseMessage
      responseMessage={responseMessage}
      isCompletedStream={isCompletedStream}
      isLastMessageItem={isLastMessageItem}
    />
  );
};
