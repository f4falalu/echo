import React, { useMemo } from 'react';
import type {
  BusterChatMessageReasoning,
  BusterChatMessageReasoning_text
} from '@/api/asset_interfaces/chat';
import { ReasoningMessage_PillsContainer } from './ReasoningMessage_PillContainers';
import { ReasoningMessage_Files } from './ReasoningMessage_Files';
import { ReasoningMessage_Text } from './ReasoningMessage_Text';
import { useMessageIndividual } from '@/context/Chats';
import { AnimatePresence, motion } from 'framer-motion';
import { BarContainer } from './BarContainer';

export interface ReasoningMessageProps {
  reasoningMessageId: string;
  messageId: string;
  isCompletedStream: boolean;
  chatId: string;
}

const itemAnimationConfig = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: {
        type: 'spring',
        stiffness: 400,
        damping: 32
      },
      opacity: { duration: 0.16 }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        type: 'spring',
        stiffness: 450,
        damping: 35
      },
      opacity: { duration: 0.12 }
    }
  }
};

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
  const { title, type, secondary_title, status, hasMessage } = useMessageIndividual(
    messageId,
    (x) => ({
      title: x?.reasoning_messages[reasoningMessageId]?.title,
      secondary_title: x?.reasoning_messages[reasoningMessageId]?.secondary_title,
      type: x?.reasoning_messages[reasoningMessageId]?.type,
      status: x?.reasoning_messages[reasoningMessageId]?.status,
      hasMessage:
        (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)?.message !==
        ''
    })
  );

  const showBar = useMemo(() => {
    if (type === 'text') return hasMessage;
    return true;
  }, [type, hasMessage]);

  if (!type || !status) return null;

  const ReasoningMessage = ReasoningMessageRecord[type];
  const animationKey = reasoningMessageId + type;

  return (
    <BarContainer
      showBar={showBar}
      status={status}
      isCompletedStream={isCompletedStream}
      title={title ?? ''}
      secondaryTitle={secondary_title ?? ''}>
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

const showBarHelper = (
  type: BusterChatMessageReasoning['type'],
  status: BusterChatMessageReasoning['status']
) => {
  if (type === 'pills') return false;
  if (status === 'loading') return false;
  return true;
};
