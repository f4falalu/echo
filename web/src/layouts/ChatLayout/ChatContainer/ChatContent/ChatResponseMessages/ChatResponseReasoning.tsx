import React, { useMemo } from 'react';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { useMemoizedFn } from '@/hooks';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { Text } from '@/components/ui/typography';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { useMessageIndividual } from '@/context/Chats';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';

const animations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { delay: 0.125 }
};

export const ChatResponseReasoning: React.FC<{
  reasoningMessageId: string | undefined;
  finalReasoningMessage: string | undefined | null;
  isCompletedStream: boolean;
  messageId: string;
}> = React.memo(({ reasoningMessageId, isCompletedStream, messageId }) => {
  const lastMessageTitle = useMessageIndividual(
    messageId,
    (x) => x?.reasoning_messages?.[reasoningMessageId ?? '']?.title
  );
  const finalReasoningMessage = useMessageIndividual(messageId, (x) => x?.final_reasoning_message);
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFileType);
  const isReasonginFileSelected = selectedFileType === 'reasoning' && isCompletedStream;

  const blackBoxMessage = useQuery({
    ...queryKeys.chatsBlackBoxMessages(messageId),
    notifyOnChangeProps: ['data']
  }).data;

  const text: string = useMemo(() => {
    if (finalReasoningMessage) return finalReasoningMessage;
    if (blackBoxMessage) return blackBoxMessage;
    if (lastMessageTitle) return lastMessageTitle;
    return lastMessageTitle || 'Thinking...';
  }, [lastMessageTitle, finalReasoningMessage, blackBoxMessage]);

  const onClickReasoning = useMemoizedFn(() => {
    onSetSelectedFile({
      type: 'reasoning',
      id: messageId
    });
  });

  return (
    <AnimatePresence initial={!isCompletedStream} mode="wait">
      <motion.div
        {...animations}
        key={text}
        className="mb-3.5 w-fit cursor-pointer"
        onClick={onClickReasoning}>
        {isReasonginFileSelected ? (
          <Text className="hover:underline">{text}</Text>
        ) : (
          <ShimmerText text={text ?? ''} />
        )}
      </motion.div>
    </AnimatePresence>
  );
});

ChatResponseReasoning.displayName = 'ChatThoughts';
