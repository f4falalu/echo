import React, { useMemo } from 'react';
import type {
  BusterChatMessage_text,
  BusterChatMessageReasoning,
  BusterChatMessageResponse
} from '@/api/asset_interfaces';
import { MessageContainer } from '../MessageContainer';
import { ChatResponseMessageSelector } from './ChatResponseMessageSelector';
import { ChatResponseReasoning } from './ChatResponseReasoning';
import { ShimmerText } from '@/components/text';

interface ChatResponseMessagesProps {
  responseMessages: BusterChatMessageResponse[];
  isCompletedStream: boolean;
  reasoningMessages: BusterChatMessageReasoning[];
  messageId: string;
}

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ responseMessages, reasoningMessages, isCompletedStream, messageId }) => {
    const lastMessageIndex = responseMessages.length - 1;

    const showDefaultMessage = responseMessages.length === 0;

    const reasonginStepIndex = useMemo(() => {
      const lastTextMessage = responseMessages.findLast(
        (message) => message.type === 'text' && message.is_final_message !== false
      ) as BusterChatMessage_text;

      if (!lastTextMessage) return -1;
      if (lastTextMessage?.message_chunk) return -1;

      return responseMessages.findIndex((message) => message.id === lastTextMessage.id);
    }, [responseMessages]);

    return (
      <MessageContainer className="flex w-full flex-col overflow-hidden">
        {showDefaultMessage && <DefaultFirstMessage />}

        {responseMessages.map((responseMessage, index) => (
          <React.Fragment key={responseMessage.id}>
            <ChatResponseMessageSelector
              responseMessage={responseMessage}
              isCompletedStream={isCompletedStream}
              isLastMessageItem={index === lastMessageIndex}
            />

            {index === reasonginStepIndex && (
              <ChatResponseReasoning
                reasoningMessages={reasoningMessages}
                isCompletedStream={isCompletedStream}
                messageId={messageId}
              />
            )}
          </React.Fragment>
        ))}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';

const DefaultFirstMessage: React.FC = () => {
  return (
    <div>
      <ShimmerText text="Thinking..." />
    </div>
  );
};
