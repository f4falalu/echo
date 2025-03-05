import React from 'react';
import { ChatUserMessage } from './ChatUserMessage';
import { ChatResponseMessages } from './ChatResponseMessages';
import { useMessageIndividual } from '@/context/Chats';

export const ChatMessageBlock: React.FC<{
  messageId: string;
}> = React.memo(({ messageId }) => {
  const requestMessage = useMessageIndividual(messageId, (message) => message?.request_message);
  const isCompletedStream = useMessageIndividual(messageId, (x) => x?.isCompletedStream);

  if (!requestMessage) return null;

  return (
    <div className={'flex flex-col space-y-3.5 py-2 pr-3 pl-4'} id={messageId}>
      <ChatUserMessage requestMessage={requestMessage} />
      <ChatResponseMessages isCompletedStream={isCompletedStream!} messageId={messageId} />
    </div>
  );
});

ChatMessageBlock.displayName = 'ChatMessageBlock';
