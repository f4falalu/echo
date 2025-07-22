import React from 'react';
import { useGetChatMessage } from '@/api/buster_rest/chats';
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
    const { data: responseMessageIds } = useGetChatMessage(messageId, {
      select: (x) => x?.response_message_ids || []
    });
    const { data: lastReasoningMessageId } = useGetChatMessage(messageId, {
      select: (x) => x?.reasoning_message_ids?.[x.reasoning_message_ids.length - 1]
    });
    const { data: finalReasoningMessage } = useGetChatMessage(messageId, {
      select: (x) => x?.final_reasoning_message
    });
    const showReasoningMessage =
      messageIndex === 0 ? !!lastReasoningMessageId || !isStreamFinished : true;

    return (
      <MessageContainer
        className="group flex w-full flex-col space-y-3 overflow-hidden"
        hideAvatar={false}
        isStreamFinished={isStreamFinished}
        isFinishedReasoning={!!finalReasoningMessage}
        hasReasoningMessage={!!lastReasoningMessageId}>
        {showReasoningMessage && (
          <ChatResponseReasoning
            reasoningMessageId={lastReasoningMessageId}
            finalReasoningMessage={finalReasoningMessage}
            isStreamFinished={isStreamFinished}
            messageId={messageId}
            chatId={chatId}
          />
        )}

        {responseMessageIds?.map((responseMessageId, index) => (
          <React.Fragment key={responseMessageId}>
            <ChatResponseMessageSelector
              responseMessageId={responseMessageId}
              messageId={messageId}
              isStreamFinished={isStreamFinished}
              chatId={chatId}
            />
          </React.Fragment>
        ))}

        {isStreamFinished && <ChatMessageOptions messageId={messageId} chatId={chatId} />}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';
