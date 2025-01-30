import React from 'react';
import { ChatUserMessage } from './ChatUserMessage';
import { ChatResponseMessages } from './ChatResponseMessages';
import { createStyles } from 'antd-style';
import type { IBusterChatMessage } from '@/context/Chats/interfaces';

export const ChatMessageBlock: React.FC<{
  message: IBusterChatMessage;
}> = React.memo(({ message }) => {
  const { request_message, response_messages, id, isCompletedStream } = message;

  return (
    <div className={'flex flex-col space-y-3.5 py-2 pl-4 pr-3'} id={id}>
      <ChatUserMessage requestMessage={request_message} />
      <ChatResponseMessages
        responseMessages={response_messages}
        isCompletedStream={isCompletedStream}
      />
    </div>
  );
});

ChatMessageBlock.displayName = 'ChatMessageBlock';
