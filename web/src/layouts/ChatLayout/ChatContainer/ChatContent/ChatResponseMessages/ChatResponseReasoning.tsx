import React, { useMemo } from 'react';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { useMemoizedFn } from 'ahooks';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { Text } from '@/components/ui/typography';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { useMessageIndividual } from '@/context/Chats';

const animations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
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

  const text: string = useMemo(() => {
    if (finalReasoningMessage) return finalReasoningMessage;
    if (lastMessageTitle) return lastMessageTitle;
    return lastMessageTitle || 'Thinking...';
  }, [lastMessageTitle, finalReasoningMessage]);

  const onClickReasoning = useMemoizedFn(() => {
    onSetSelectedFile({
      type: 'reasoning',
      id: messageId
    });
  });

  console.log(isReasonginFileSelected, isCompletedStream);

  return (
    <AnimatePresence initial={!isCompletedStream} mode="wait">
      <motion.div {...animations} key={text} className="mb-3.5 w-fit" onClick={onClickReasoning}>
        {isReasonginFileSelected ? (
          <Text className="cursor-pointer hover:underline">{text}</Text>
        ) : (
          <ShimmerText text={text ?? ''} />
        )}
      </motion.div>
    </AnimatePresence>
  );
});

ChatResponseReasoning.displayName = 'ChatThoughts';
