import React from 'react';
import { ChatResponseMessage_File } from './ChatResponseMessage_File';
import type { BusterChatMessageResponse } from '@/api/asset_interfaces';
import { useMessageIndividual } from '@/context/Chats';
import { ChatResponseMessage_Text } from './ChatResponseMessage_Text';

export interface ChatResponseMessageProps {
  responseMessageId: string;
  messageId: string;
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
}

const ChatResponseMessageRecord: Record<
  BusterChatMessageResponse['type'],
  React.FC<ChatResponseMessageProps>
> = {
  text: ChatResponseMessage_Text,
  file: ChatResponseMessage_File
};

export interface ChatResponseMessageSelectorProps {
  responseMessageId: string;
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
  messageId: string;
}

export const ChatResponseMessageSelector: React.FC<ChatResponseMessageSelectorProps> = React.memo(
  ({ responseMessageId, messageId, isCompletedStream, isLastMessageItem }) => {
    const messageType = useMessageIndividual(
      messageId,
      (x) => x?.response_messages?.[responseMessageId]?.type || 'text'
    );

    const ChatResponseMessage = ChatResponseMessageRecord[messageType];

    return (
      <ChatResponseMessage
        responseMessageId={responseMessageId}
        isCompletedStream={isCompletedStream}
        isLastMessageItem={isLastMessageItem}
        messageId={messageId}
      />
    );
  }
);

ChatResponseMessageSelector.displayName = 'ChatResponseMessageSelector';
