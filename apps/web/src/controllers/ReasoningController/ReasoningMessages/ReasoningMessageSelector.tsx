import { AnimatePresence, motion, type MotionProps } from 'framer-motion';
import React from 'react';
import { useMemo } from 'react';
import type {
  BusterChatMessageReasoning,
  BusterChatMessageReasoning_files,
  BusterChatMessageReasoning_text
} from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { BarContainer } from './BarContainer';
import { ReasoningMessage_Files } from './ReasoningMessage_Files';
import { ReasoningMessage_PillsContainer } from './ReasoningMessage_PillContainers';
import { ReasoningMessage_Text } from './ReasoningMessage_Text';
import isEmpty from 'lodash/isEmpty';

const itemAnimationConfig: MotionProps = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      opacity: { duration: 0.16 }
    }
  },
  exit: {
    opacity: 0,
    transition: {
      opacity: { duration: 0.12 }
    }
  }
};

export interface ReasoningMessageProps {
  reasoningMessageId: string;
  messageId: string;
  isStreamFinished: boolean;
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
  isStreamFinished: boolean;
  chatId: string;
  isLastMessage: boolean;
}

export const ReasoningMessageSelector: React.FC<ReasoningMessageSelectorProps> = React.memo(
  ({ reasoningMessageId, isStreamFinished, chatId, messageId, isLastMessage }) => {
    const { data: messageStuff } = useGetChatMessage(messageId, {
      select: (x) => ({
        title: x?.reasoning_messages[reasoningMessageId]?.title,
        secondary_title: x?.reasoning_messages[reasoningMessageId]?.secondary_title,
        type: x?.reasoning_messages[reasoningMessageId]?.type,
        status: x?.reasoning_messages[reasoningMessageId]?.status,
        hasMessage: !!(x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)
          ?.message,
        hasFiles: !isEmpty(
          (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_files)?.files
        )
      })
    });
    const { title, secondary_title, type, status, hasMessage, hasFiles } = messageStuff || {};

    const showBar = useMemo(() => {
      if (type === 'text') return !!hasMessage || !isLastMessage;
      if (type === 'files') return !!hasFiles;
      return true;
    }, [type, hasMessage, isLastMessage, hasFiles]);

    if (!type || !status) return null;

    const ReasoningMessage = ReasoningMessageRecord[type];
    const animationKey = reasoningMessageId + type;

    return (
      <BarContainer
        showBar={showBar}
        status={status}
        isStreamFinished={isStreamFinished}
        title={title ?? ''}
        secondaryTitle={secondary_title ?? ''}>
        <AnimatePresence mode="wait" initial={!isStreamFinished}>
          <motion.div
            key={animationKey}
            {...itemAnimationConfig}
            className="h-auto"
            //  layout={!isStreamFinished} I removed this because it was causing weird animation issues
          >
            <div className="min-h-[1px]">
              <ReasoningMessage
                reasoningMessageId={reasoningMessageId}
                isStreamFinished={isStreamFinished}
                messageId={messageId}
                chatId={chatId}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </BarContainer>
    );
  }
);

ReasoningMessageSelector.displayName = 'ReasoningMessageSelector';
