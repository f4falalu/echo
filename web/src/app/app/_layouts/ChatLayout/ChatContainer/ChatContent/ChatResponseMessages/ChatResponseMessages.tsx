import React, { useMemo } from 'react';
import type {
  BusterChatMessage_text,
  BusterChatMessageReasoning,
  BusterChatMessageResponse
} from '@/api/asset_interfaces';
import { MessageContainer } from '../MessageContainer';
import { ChatResponseMessageSelector } from './ChatResponseMessageSelector';
import { ChatResponseReasoning } from './ChatResponseReasoning';

interface ChatResponseMessagesProps {
  responseMessages: BusterChatMessageResponse[];
  isCompletedStream: boolean;
  reasoningMessages: BusterChatMessageReasoning[];
  messageId: string;
}

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ responseMessages, reasoningMessages, isCompletedStream, messageId }) => {
    const firstResponseMessage = responseMessages[0] as BusterChatMessage_text;
    const restResponseMessages = useMemo(() => {
      if (!firstResponseMessage) return [];
      return responseMessages.slice(1);
    }, [firstResponseMessage, responseMessages]);

    const lastMessageIndex = responseMessages.length - 1;

    return (
      <MessageContainer className="flex w-full flex-col overflow-hidden">
        {firstResponseMessage && (
          <ChatResponseMessageSelector
            key={firstResponseMessage.id}
            responseMessage={firstResponseMessage}
            isCompletedStream={isCompletedStream}
            isLastMessageItem={false}
          />
        )}

        {firstResponseMessage && (
          <ChatResponseReasoning
            reasoningMessages={reasoningMessages}
            isCompletedStream={isCompletedStream}
            messageId={messageId}
          />
        )}

        {restResponseMessages.map((responseMessage, index) => (
          <ChatResponseMessageSelector
            key={responseMessage.id}
            responseMessage={responseMessage}
            isCompletedStream={isCompletedStream}
            isLastMessageItem={index === lastMessageIndex}
          />
        ))}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';
