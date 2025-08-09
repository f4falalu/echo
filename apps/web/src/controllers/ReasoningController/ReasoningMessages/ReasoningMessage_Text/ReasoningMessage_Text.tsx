import React, { useCallback } from 'react';
import type {
  BusterChatMessage,
  BusterChatMessageReasoning_text
} from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import AppMarkdownStreaming from '@/components/ui/streaming/AppMarkdownStreaming/AppMarkdownStreaming';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';

export const ReasoningMessage_Text: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, isLastMessage, messageId, isStreamFinished }) => {
    const { data: message } = useGetChatMessage(messageId, {
      select: useCallback(
        (x: BusterChatMessage) =>
          (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)?.message,
        [reasoningMessageId]
      ),
      notifyOnChangeProps: ['data']
    });

    if (!message) return null;

    return <div className="text-text-secondary text-xs!">{message}</div>;

    // return (
    //   <AppMarkdownStreaming
    //     content={message}
    //     isStreamFinished={isStreamFinished || !isLastMessage}
    //     className="text-text-secondary text-xs!"
    //   />
    // );
  }
);

ReasoningMessage_Text.displayName = 'ReasoningMessage_Text';
