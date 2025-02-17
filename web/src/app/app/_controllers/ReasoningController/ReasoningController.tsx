'use client';
import React from 'react';
import { useChatIndividualContextSelector } from '../../_layouts/ChatLayout/ChatContext';
import { ReasoningMessageContainer } from './ReasoningMessageContainer';
import { useMessageIndividual } from '@/context/Chats';

interface ReasoningControllerProps {
  chatId: string;
  messageId: string;
}

export const ReasoningController: React.FC<ReasoningControllerProps> = ({ chatId, messageId }) => {
  const hasChat = useChatIndividualContextSelector((state) => state.hasChat);
  const message = useMessageIndividual(messageId);

  if (!hasChat || !message) return null;

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
