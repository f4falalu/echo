import React from 'react';
import type { BusterChatMessageReasoning } from '@/api/asset_interfaces';
import { ReasoningMessage_PillsContainer } from './ReasoningMessage_PillContainers';
import { ReasoningMessage_Files } from './ReasoningMessage_Files';
import { ReasoningMessage_Text } from './ReasoningMessage_Text';
import { useMessageIndividual } from '@/context/Chats';
import { AnimatePresence, motion } from 'framer-motion';
import { itemAnimationConfig } from './animationConfig';
import { BarContainer } from './BarContainer';

export interface ReasoningMessageProps {
  reasoningMessageId: string;
  messageId: string;
  isCompletedStream: boolean;
  chatId: string;
}

const ReasoningMessageRecord: Record<
  BusterChatMessageReasoning['type'],
  React.FC<ReasoningMessageProps>
> = {
  pills: ReasoningMessage_PillsContainer,
  text: ReasoningMessage_Text,
  files: ReasoningMessage_Files
};

export interface ReasoningMessageSelectorProps {
  reasoningMessageId: string;
  messageId: string;
  isCompletedStream: boolean;
  chatId: string;
}

export const ReasoningMessageSelector: React.FC<ReasoningMessageSelectorProps> = ({
  reasoningMessageId,
  isCompletedStream,
  chatId,
  messageId
}) => {
  const { title, type, secondary_title, status } = useMessageIndividual(messageId, (x) => ({
    title: x?.reasoning_messages[reasoningMessageId]?.title,
    secondary_title: x?.reasoning_messages[reasoningMessageId]?.secondary_title,
    type: x?.reasoning_messages[reasoningMessageId]?.type,
    status: x?.reasoning_messages[reasoningMessageId]?.status
  }));

  if (!title || !secondary_title || !type || !status) return null;

  const ReasoningMessage = ReasoningMessageRecord[type];
  const animationKey = reasoningMessageId + type;

  return (
    <BarContainer
      showBar={true}
      status={status}
      isCompletedStream={isCompletedStream}
      title={title}
      secondaryTitle={secondary_title}>
      <AnimatePresence mode="wait">
        <motion.div key={animationKey} {...itemAnimationConfig} className="overflow-hidden" layout>
          <ReasoningMessage
            reasoningMessageId={reasoningMessageId}
            isCompletedStream={isCompletedStream}
            messageId={messageId}
            chatId={chatId}
          />
        </motion.div>
      </AnimatePresence>
    </BarContainer>
  );
};
