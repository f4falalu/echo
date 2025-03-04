'use client';

import React from 'react';
import { useChatIndividualContextSelector } from '@chatLayout/ChatContext';
import { ReasoningMessageContainer } from './ReasoningMessageContainer';
import { useMessageIndividual } from '@/context/Chats';
import { useMount } from 'ahooks';

interface ReasoningControllerProps {
  chatId: string;
  messageId: string;
}

export const ReasoningController: React.FC<ReasoningControllerProps> = ({ chatId, messageId }) => {
  const hasChat = useChatIndividualContextSelector((state) => state.hasChat);
  const message = useMessageIndividual(messageId);

  console.log('mounted', hasChat, message?.id);

  if (!hasChat || !message) return <div className="h-full w-full bg-red-500">NUTS</div>;

  const reasoningMessages = message.reasoning;
  const isCompletedStream = message.isCompletedStream;

  return (
    <div className="h-full overflow-y-auto p-5">
      <ReasoningMessageContainer
        reasoningMessages={reasoningMessages}
        isCompletedStream={isCompletedStream}
        chatId={chatId}
      />
    </div>
  );
};
