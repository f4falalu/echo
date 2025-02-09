import React from 'react';
import { ChatUserMessage } from './ChatUserMessage';
import { ChatResponseMessages } from './ChatResponseMessages';
import { useBusterChatContextSelector } from '@/context/Chats';

export const ChatMessageBlock: React.FC<{
  messageId: string;
}> = React.memo(({ messageId }) => {
  const message = useBusterChatContextSelector((state) => state.chatsMessages[messageId]);
  const { request_message, response_messages, id, isCompletedStream, reasoning } = message || {};

  if (!message) return null;

  return (
    <div className={'flex flex-col space-y-3.5 py-2 pl-4 pr-3'} id={id}>
      <ChatUserMessage requestMessage={request_message} />
      <ChatResponseMessages
        responseMessages={response_messages}
        isCompletedStream={isCompletedStream}
        reasoningMessages={reasoning}
        messageId={id}
      />
    </div>
  );
});

ChatMessageBlock.displayName = 'ChatMessageBlock';
