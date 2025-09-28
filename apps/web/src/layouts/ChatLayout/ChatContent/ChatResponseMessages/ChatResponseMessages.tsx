import React from 'react';
import {
  useGetChatMessageFinalReasoningMessage,
  useGetChatMessageLastReasoningMessageId,
  useGetChatMessageResponseMessageIds,
} from '@/context/Chats/useGetChatMessage';
import { ChatMessageOptions } from '../ChatMessageOptions';
import { MessageContainer } from '../MessageContainer';
import { ChatResponseMessageSelector } from './ChatResponseMessageSelector';
import { ChatResponseReasoning } from './ChatResponseReasoning';

interface ChatResponseMessagesProps {
  isStreamFinished: boolean;
  messageId: string;
  chatId: string;
  messageIndex: number;
}

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ chatId, isStreamFinished, messageId, messageIndex }) => {
    const responseMessageIds = useGetChatMessageResponseMessageIds({ messageId });
    const lastReasoningMessageId = useGetChatMessageLastReasoningMessageId({ messageId });
    const finalReasoningMessage = useGetChatMessageFinalReasoningMessage({ messageId });

    const showReasoningMessage =
      messageIndex === 0 ? !!lastReasoningMessageId || !isStreamFinished : true;

    return (
      <MessageContainer
        className="group flex w-full flex-col space-y-3 overflow-hidden"
        hideAvatar={false}
        isStreamFinished={isStreamFinished}
        isFinishedReasoning={!!finalReasoningMessage}
        hasReasoningMessage={!!lastReasoningMessageId}
      >
        {showReasoningMessage && (
          <ChatResponseReasoning
            reasoningMessageId={lastReasoningMessageId}
            finalReasoningMessage={finalReasoningMessage}
            isStreamFinished={isStreamFinished}
            messageId={messageId}
            chatId={chatId}
          />
        )}

        {responseMessageIds?.map((responseMessageId) => (
          <ChatResponseMessageSelector
            key={responseMessageId}
            responseMessageId={responseMessageId}
            messageId={messageId}
            isStreamFinished={isStreamFinished}
            chatId={chatId}
          />
        ))}

        {isStreamFinished && <ChatMessageOptions messageId={messageId} chatId={chatId} />}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';
