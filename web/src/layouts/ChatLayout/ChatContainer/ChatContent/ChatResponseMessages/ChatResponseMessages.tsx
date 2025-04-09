import React from 'react';
import { MessageContainer } from '../MessageContainer';
import { ChatResponseMessageSelector } from './ChatResponseMessageSelector';
import { ChatResponseReasoning } from './ChatResponseReasoning';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { ChatMessageOptions } from '../ChatMessageOptions';

interface ChatResponseMessagesProps {
  isCompletedStream: boolean;
  messageId: string;
  chatId: string;
}

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ chatId, isCompletedStream, messageId }) => {
    const responseMessageIds = useGetChatMessage(messageId, (x) => x?.response_message_ids || [])!;
    const lastReasoningMessageId = useGetChatMessage(
      messageId,
      (x) => x?.reasoning_message_ids?.[x.reasoning_message_ids.length - 1]
    );
    const finalReasoningMessage = useGetChatMessage(messageId, (x) => x?.final_reasoning_message);
    const showReasoningMessage = !!lastReasoningMessageId || !isCompletedStream;

    return (
      <MessageContainer className="flex w-full flex-col space-y-3 overflow-hidden">
        {showReasoningMessage && (
          <ChatResponseReasoning
            reasoningMessageId={lastReasoningMessageId}
            finalReasoningMessage={finalReasoningMessage}
            isCompletedStream={isCompletedStream}
            messageId={messageId}
            chatId={chatId}
          />
        )}

        {responseMessageIds.map((responseMessageId, index) => (
          <React.Fragment key={responseMessageId}>
            <ChatResponseMessageSelector
              responseMessageId={responseMessageId}
              messageId={messageId}
              isCompletedStream={isCompletedStream}
              chatId={chatId}
            />
          </React.Fragment>
        ))}

        {isCompletedStream && <ChatMessageOptions messageId={messageId} chatId={chatId} />}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';
