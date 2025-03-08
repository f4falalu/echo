import React from 'react';
import { StreamingMessage_Text } from '@/components/ui/streaming/StreamingMessage_Text';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { type BusterChatMessageReasoning_text } from '@/api/asset_interfaces/chat';
import { BarContainer } from '../BarContainer';
import { useMessageIndividual } from '@/context/Chats';

export const ReasoningMessage_Text: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isCompletedStream, animationKey }) => {
    const reasoningMessage = useMessageIndividual(
      messageId,
      (x) => x?.reasoning_messages[reasoningMessageId]
    )!;

    const { message, status, id, type, title, secondary_title } =
      reasoningMessage as BusterChatMessageReasoning_text;

    return (
      <BarContainer
        showBar={!!message?.length}
        status={status}
        animationKey={animationKey}
        isCompletedStream={isCompletedStream}
        title={title}
        secondaryTitle={secondary_title}>
        <StreamingMessage_Text isCompletedStream={isCompletedStream} message={message ?? ''} />
      </BarContainer>
    );
  }
);

ReasoningMessage_Text.displayName = 'ReasoningMessage_Text';

{
  /* <StreamingMessage_Text
{...props}
message={(props.reasoningMessage as BusterChatMessageReasoning_text).message ?? ''}
/> */
}
