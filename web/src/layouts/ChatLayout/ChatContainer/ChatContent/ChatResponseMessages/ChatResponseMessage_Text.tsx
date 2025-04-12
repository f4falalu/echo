import React from 'react';
import { ChatResponseMessageProps } from './ChatResponseMessageSelector';
import { BusterChatResponseMessage_text } from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { AppMarkdownDynamic as AppMarkdown } from '@/components/ui/typography/AppMarkdown/AppMarkdownDynamic';

export const ChatResponseMessage_Text: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessageId, messageId, isCompletedStream }) => {
    const responseMessage = useGetChatMessage(
      messageId,
      (x) => x?.response_messages?.[responseMessageId]
    ) as BusterChatResponseMessage_text;
    const { message } = responseMessage;

    return (
      <AppMarkdown
        markdown={message}
        showLoader={!isCompletedStream}
        className="text-base leading-1.5!"
        stripFormatting
      />
    );

    // return <StreamingMessage_Text message={message} isCompletedStream={isCompletedStream} />;
  }
);

ChatResponseMessage_Text.displayName = 'ChatResponseMessage_Text';
