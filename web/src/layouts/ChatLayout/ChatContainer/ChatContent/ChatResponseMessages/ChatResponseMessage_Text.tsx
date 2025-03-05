import React from 'react';
import { ChatResponseMessageProps } from './ChatResponseMessageSelector';
import { StreamingMessage_Text } from '@/components/ui/streaming/StreamingMessage_Text';

export const ChatResponseMessage_Text: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessageId, messageId, isCompletedStream, isLastMessageItem }) => {
    return <div>ChatResponseMessage_Text</div>;
  }
);
