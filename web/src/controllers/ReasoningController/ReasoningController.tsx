'use client';

import React from 'react';
import { useChatIndividualContextSelector } from '@chatLayout/ChatContext';
import { ReasoningMessageContainer } from './ReasoningMessageContainer';
import { useMessageIndividual } from '@/context/Chats';

interface ReasoningControllerProps {
  chatId: string;
  messageId: string;
}

export const ReasoningController: React.FC<ReasoningControllerProps> = ({ chatId, messageId }) => {
  const hasChat = useChatIndividualContextSelector((state) => state.hasChat);
  const reasoningMessageIds = useMessageIndividual(messageId, (x) => x?.reasoning_message_ids);
  const isCompletedStream = useMessageIndividual(messageId, (x) => x?.isCompletedStream);

  if (!hasChat || !reasoningMessageIds) return <></>;

  return (
    <div className="h-full overflow-y-auto p-5">
      <ReasoningMessageContainer
        reasoningMessageIds={reasoningMessageIds}
        isCompletedStream={isCompletedStream ?? false}
        chatId={chatId}
      />
    </div>
  );
};
