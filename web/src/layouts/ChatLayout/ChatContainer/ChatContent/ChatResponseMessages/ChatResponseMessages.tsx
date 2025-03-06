import React from 'react';
import { MessageContainer } from '../MessageContainer';
import { ChatResponseMessageSelector } from './ChatResponseMessageSelector';
import { ChatResponseReasoning } from './ChatResponseReasoning';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { useMessageIndividual } from '@/context/Chats';

interface ChatResponseMessagesProps {
  isCompletedStream: boolean;
  messageId: string;
}

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ isCompletedStream, messageId }) => {
    const responseMessageIds = useMessageIndividual(
      messageId,
      (x) => x?.response_message_ids || []
    );
    const lastReasoningMessageId = useMessageIndividual(
      messageId,
      (x) => x?.reasoning_message_ids?.[x.reasoning_message_ids.length - 1]
    );
    const finalReasoningMessage = useMessageIndividual(
      messageId,
      (x) => x?.final_reasoning_message
    );

    return (
      <MessageContainer className="flex w-full flex-col space-y-3 overflow-hidden">
        <ChatResponseReasoning
          reasoningMessageId={lastReasoningMessageId}
          finalReasoningMessage={finalReasoningMessage}
          isCompletedStream={isCompletedStream}
          messageId={messageId}
        />

        {responseMessageIds.map((responseMessageId, index) => (
          <React.Fragment key={responseMessageId}>
            <ChatResponseMessageSelector
              responseMessageId={responseMessageId}
              messageId={messageId}
              isCompletedStream={isCompletedStream}
            />
          </React.Fragment>
        ))}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';
