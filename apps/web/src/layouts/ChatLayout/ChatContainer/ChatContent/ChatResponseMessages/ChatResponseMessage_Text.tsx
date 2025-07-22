import React from 'react';
import type { BusterChatResponseMessage_text } from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import AppMarkdownStreaming from '@/components/ui/streaming/AppMarkdownStreaming/AppMarkdownStreaming';
import type { ChatResponseMessageProps } from './ChatResponseMessageSelector';

//IF I use dynamic import it will decrease the bundle size by 200kb. The problem is with the AppCodeBlock
// import { AppMarkdownDynamic as AppMarkdown } from '@/components/ui/typography/AppMarkdown/AppMarkdownDynamic';

export const ChatResponseMessage_Text: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessageId, messageId, isStreamFinished }) => {
    const { data: responseMessage } = useGetChatMessage(messageId, {
      select: (x) => x?.response_messages?.[responseMessageId]
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
