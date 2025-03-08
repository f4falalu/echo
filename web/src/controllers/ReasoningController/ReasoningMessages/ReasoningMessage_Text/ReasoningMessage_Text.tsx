import React from 'react';
import { StreamingMessage_Text } from '@/components/ui/streaming/StreamingMessage_Text';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { type BusterChatMessageReasoning_text } from '@/api/asset_interfaces/chat';
import { useMessageIndividual } from '@/context/Chats';

export const ReasoningMessage_Text: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isCompletedStream }) => {
    const message = useMessageIndividual(
      messageId,
      (x) => (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)?.message
    )!;

    return <StreamingMessage_Text isCompletedStream={isCompletedStream} message={message ?? ''} />;
  }
);

ReasoningMessage_Text.displayName = 'ReasoningMessage_Text';
