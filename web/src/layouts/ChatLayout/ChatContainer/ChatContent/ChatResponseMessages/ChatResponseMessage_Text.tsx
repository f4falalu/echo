import React from 'react';
import { ChatResponseMessageProps } from './ChatResponseMessageSelector';
import { StreamingMessage_Text } from '@/components/ui/streaming/StreamingMessage_Text';
import { BusterChatResponseMessage_text } from '@/api/asset_interfaces';
import { useMessageIndividual } from '@/context/Chats';

export const ChatResponseMessage_Text: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessageId, messageId, isCompletedStream }) => {
    const responseMessage = useMessageIndividual(
      messageId,
      (x) => x?.response_messages?.[responseMessageId]
    ) as BusterChatResponseMessage_text;
    const { message } = responseMessage;

    return <StreamingMessage_Text message={message} isCompletedStream={isCompletedStream} />;
  }
);

ChatResponseMessage_Text.displayName = 'ChatResponseMessage_Text';
