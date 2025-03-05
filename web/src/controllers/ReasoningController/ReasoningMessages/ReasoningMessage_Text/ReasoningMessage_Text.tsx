import React from 'react';
import { StreamingMessage_Text } from '@/components/ui/streaming/StreamingMessage_Text';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { type BusterChatMessageReasoning_text } from '@/api/asset_interfaces/chat';
import { BarContainer } from '../BarContainer';

export const ReasoningMessage_Text: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessage, chatId, isCompletedStream, isLastMessageItem }) => {
    const { message, status, id, type, title, secondary_title } =
      reasoningMessage as BusterChatMessageReasoning_text;

    console.log('here', message?.length);
    return (
      <BarContainer
        showBar={true}
        status={status}
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
