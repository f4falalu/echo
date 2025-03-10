import React from 'react';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { type BusterChatMessageReasoning_text } from '@/api/asset_interfaces/chat';
import { useMessageIndividual } from '@/context/Chats';
import { AppMarkdown } from '@/components/ui/typography/AppMarkdown';
import { StreamingMessage_Text } from '@/components/ui/streaming/StreamingMessage_Text';

export const ReasoningMessage_Text: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isCompletedStream }) => {
    const message = useMessageIndividual(
      messageId,
      (x) => (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)?.message
    )!;

    // return <StreamingMessage_Text isCompletedStream={isCompletedStream} message={message} />;

    return <AppMarkdown markdown={message} showLoader={!isCompletedStream} stripFormatting />;
  }
);

ReasoningMessage_Text.displayName = 'ReasoningMessage_Text';
