import React, { useCallback } from 'react';
import type { BusterChatMessage, BusterChatResponseMessage_text } from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import AppMarkdownStreaming from '@/components/ui/streaming/AppMarkdownStreaming/AppMarkdownStreaming';
import type { ChatResponseMessageProps } from './ChatResponseMessageSelector';

export const ChatResponseMessage_Text: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessageId, messageId, isStreamFinished }) => {
    const { data: responseMessage } = useGetChatMessage(messageId, {
      select: useCallback(
        (x: BusterChatMessage) => x?.response_messages?.[responseMessageId],
        [responseMessageId]
      ),
      notifyOnChangeProps: ['data'],
    });
    const { message } = responseMessage as BusterChatResponseMessage_text;

    if (!message) return null;

    return (
      <AppMarkdownStreaming
        content={message}
        isStreamFinished={isStreamFinished}
        className="text-base leading-1.5!"
      />
    );
  }
);

ChatResponseMessage_Text.displayName = 'ChatResponseMessage_Text';
