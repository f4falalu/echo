import React from 'react';
import { ChatResponseMessage_File } from './ChatResponseMessage_File';
import type { BusterChatMessageResponse } from '@/api/asset_interfaces';
import { useMessageIndividual } from '@/context/Chats';
import { ChatResponseMessage_Text } from './ChatResponseMessage_Text';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { useMemoizedFn } from 'ahooks';

const ChatResponseMessageRecord: Record<
  BusterChatMessageResponse['type'],
  React.FC<ChatResponseMessageProps>
> = {
  text: ChatResponseMessage_Text,
  file: ChatResponseMessage_File
};

export interface ChatResponseMessageProps {
  isCompletedStream: boolean;
  messageId: string;
  responseMessageId: string;
}

export interface ChatResponseMessageSelectorProps {
  responseMessageId: string;
  isCompletedStream: boolean;
  messageId: string;
}

export const ChatResponseMessageSelector: React.FC<ChatResponseMessageSelectorProps> = React.memo(
  ({ responseMessageId, messageId, isCompletedStream }) => {
    const messageType = useMessageIndividual(
      messageId,
      (x) => x?.response_messages?.[responseMessageId]?.type || 'text'
    );
    const ChatResponseMessage = ChatResponseMessageRecord[messageType];

    return (
      <ChatResponseMessage
        isCompletedStream={isCompletedStream}
        responseMessageId={responseMessageId}
        messageId={messageId}
      />
    );
  }
);

ChatResponseMessageSelector.displayName = 'ChatResponseMessageSelector';
