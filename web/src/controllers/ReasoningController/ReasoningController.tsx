'use client';

import React from 'react';
import { useChatIndividualContextSelector } from '@chatLayout/ChatContext';
import { useMessageIndividual } from '@/context/Chats';
import { useWhyDidYouUpdate } from 'ahooks';
import { ReasoningMessageSelector } from './ReasoningMessages';

interface ReasoningControllerProps {
  chatId: string;
  messageId: string;
}

export const ReasoningController: React.FC<ReasoningControllerProps> = ({ chatId, messageId }) => {
  const hasChat = useChatIndividualContextSelector((state) => state.hasChat);
  const reasoningMessageIds = useMessageIndividual(messageId, (x) => x?.reasoning_message_ids);
  const isCompletedStream = useMessageIndividual(messageId, (x) => x?.isCompletedStream);

  useWhyDidYouUpdate('ReasoningController', {
    hasChat,
    reasoningMessageIds,
    isCompletedStream,
    chatId,
    messageId
  });

  if (!hasChat || !reasoningMessageIds) return <></>;

  return (
    <div className="flex h-full flex-col space-y-2 overflow-y-auto p-5">
      {reasoningMessageIds?.map((reasoningMessageId) => (
        <ReasoningMessageSelector
          key={reasoningMessageId}
          reasoningMessageId={reasoningMessageId}
          isCompletedStream={isCompletedStream ?? true}
          chatId={chatId}
          messageId={messageId}
        />
      ))}
    </div>
  );
};
