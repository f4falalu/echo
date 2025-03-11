'use client';

import React from 'react';
import { useMessageIndividual } from '@/context/Chats';
import { ReasoningMessageSelector } from './ReasoningMessages';
import { BlackBoxMessage } from './ReasoningMessages/ReasoningBlackBoxMessage';
import { useGetChat } from '@/api/buster_rest/chats';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';

interface ReasoningControllerProps {
  chatId: string;
  messageId: string;
}

export const ReasoningController: React.FC<ReasoningControllerProps> = ({ chatId, messageId }) => {
  const { data: hasChat } = useGetChat({ id: chatId || '' }, (x) => !!x.id);

  const reasoningMessageIds = useMessageIndividual(messageId, (x) => x?.reasoning_message_ids);
  const isCompletedStream = useMessageIndividual(messageId, (x) => x?.isCompletedStream);

  if (!hasChat || !reasoningMessageIds) return <FileIndeterminateLoader />;

  return (
    <div className="h-full flex-col space-y-2 overflow-y-auto p-5">
      {reasoningMessageIds?.map((reasoningMessageId) => (
        <ReasoningMessageSelector
          key={reasoningMessageId}
          reasoningMessageId={reasoningMessageId}
          isCompletedStream={isCompletedStream ?? true}
          chatId={chatId}
          messageId={messageId}
        />
      ))}

      <BlackBoxMessage messageId={messageId} />
    </div>
  );
};
