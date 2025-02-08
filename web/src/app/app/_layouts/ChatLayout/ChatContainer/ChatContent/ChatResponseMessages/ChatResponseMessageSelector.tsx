import React from 'react';
import { ChatResponseMessage_File } from './ChatResponseMessage_File';
import { StreamingMessage_Text } from '@appComponents/Streaming/StreamingMessage_Text';
import type { BusterChatMessage_text, BusterChatMessageResponse } from '@/api/asset_interfaces';
import { ChatResponseMessageHidden } from './ChatResponseMessageHidden';

export interface ChatResponseMessageProps {
  responseMessage: BusterChatMessageResponse;
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
}

const ChatResponseMessageRecord: Record<
  BusterChatMessageResponse['type'],
  React.FC<ChatResponseMessageProps>
> = {
  text: (props) => (
    <StreamingMessage_Text {...props} message={props.responseMessage as BusterChatMessage_text} />
  ),
  file: ChatResponseMessage_File
};

export interface ChatResponseMessageSelectorProps {
  responseMessage: BusterChatMessageResponse | BusterChatMessageResponse[];
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
}

export const ChatResponseMessageSelector: React.FC<ChatResponseMessageSelectorProps> = ({
  responseMessage,
  isCompletedStream,
  isLastMessageItem
}) => {
  if (Array.isArray(responseMessage)) {
    return (
      <ChatResponseMessageHidden
        hiddenItems={responseMessage}
        isCompletedStream={isCompletedStream}
      />
    );
  }

  const ChatResponseMessage = ChatResponseMessageRecord[responseMessage.type];
  return (
    <ChatResponseMessage
      responseMessage={responseMessage}
      isCompletedStream={isCompletedStream}
      isLastMessageItem={isLastMessageItem}
    />
  );
};
