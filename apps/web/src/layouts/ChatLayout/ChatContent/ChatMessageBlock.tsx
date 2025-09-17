import React from 'react';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { useGetChatMessageCompleted } from '@/context/Chats/useGetChatMessage';
import { ChatResponseMessages } from './ChatResponseMessages';
import { ChatUserMessage } from './ChatUserMessage';

// Stable selector functions to prevent unnecessary re-renders
const selectMessageExists = (message: BusterChatMessage | undefined) => !!message?.id;
const selectRequestMessage = (message: BusterChatMessage | undefined) => message?.request_message;

export const ChatMessageBlock: React.FC<{
  messageId: string;
  chatId: string;
  messageIndex: number;
}> = React.memo(({ messageId, chatId, messageIndex }) => {
  const { data: messageExists } = useGetChatMessage(messageId, { select: selectMessageExists });
  const { data: requestMessage } = useGetChatMessage(messageId, { select: selectRequestMessage });
  const isStreamFinished = useGetChatMessageCompleted({ messageId });

  if (!messageExists) return null;

  return (
    <div className={'flex flex-col space-y-3.5 py-2 pr-3 pl-4'} id={messageId}>
      {requestMessage && (
        <ChatUserMessage
          isStreamFinished={isStreamFinished}
          chatId={chatId}
          messageId={messageId}
          requestMessage={requestMessage}
        />
      )}
      <ChatResponseMessages
        isStreamFinished={isStreamFinished}
        messageId={messageId}
        chatId={chatId}
        messageIndex={messageIndex}
      />
    </div>
  );
});

ChatMessageBlock.displayName = 'ChatMessageBlock';
