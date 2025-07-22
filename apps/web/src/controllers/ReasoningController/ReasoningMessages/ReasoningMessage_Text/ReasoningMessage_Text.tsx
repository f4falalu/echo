import React from 'react';
import type { BusterChatMessageReasoning_text } from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import AppMarkdownStreaming from '@/components/ui/streaming/AppMarkdownStreaming/AppMarkdownStreaming';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';

export const ReasoningMessage_Text: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isStreamFinished }) => {
    const { data: message } = useGetChatMessage(messageId, {
      select: (x) =>
        (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)?.message
    });

    if (!message) return null;

    return (
      <AppMarkdownStreaming
        content={message}
        isStreamFinished={isStreamFinished}
        className="text-text-secondary text-xs!"
      />
    );
  }
);

ReasoningMessage_Text.displayName = 'ReasoningMessage_Text';
