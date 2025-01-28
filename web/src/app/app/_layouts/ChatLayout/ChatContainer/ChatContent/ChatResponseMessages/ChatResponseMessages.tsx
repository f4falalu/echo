import React from 'react';
import type { BusterChatMessageResponse } from '@/api/buster_socket/chats';
import { MessageContainer } from '../MessageContainer';
import { ChatResponseMessage_File } from './ChatResponseMessage_File';
import { ChatResponseMessage_Text } from './ChatResponseMessage_Text';
import { ChatResponseMessage_Thought } from './ChatResponseMessage_Thought';

export interface ChatResponseMessageProps {
  responseMessage: BusterChatMessageResponse;
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
  isSelectedFile: boolean;
}

const ChatResponseMessageRecord: Record<
  BusterChatMessageResponse['type'],
  React.FC<ChatResponseMessageProps>
> = {
  text: ChatResponseMessage_Text,
  file: ChatResponseMessage_File,
  thought: ChatResponseMessage_Thought
};

interface ChatResponseMessagesProps {
  responseMessages: BusterChatMessageResponse[];
  selectedFileId: string | undefined;
  isCompletedStream: boolean;
}

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ responseMessages, isCompletedStream, selectedFileId }) => {
    const lastMessageIndex = responseMessages.length - 1;

    return (
      <MessageContainer className="flex w-full flex-col overflow-hidden">
        {responseMessages.map((responseMessage, index) => {
          const ChatResponseMessage = ChatResponseMessageRecord[responseMessage.type];
          return (
            <ChatResponseMessage
              key={responseMessage.id}
              responseMessage={responseMessage}
              isCompletedStream={isCompletedStream}
              isLastMessageItem={index === lastMessageIndex}
              isSelectedFile={responseMessage.id === selectedFileId}
            />
          );
        })}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';
