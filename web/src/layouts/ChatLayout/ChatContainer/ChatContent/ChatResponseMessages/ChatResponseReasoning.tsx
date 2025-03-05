import React, { useMemo } from 'react';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { useMemoizedFn } from 'ahooks';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { Stars } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { useMessageIndividual } from '@/context/Chats';
import { cn } from '@/lib/classMerge';

const animations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const ChatResponseReasoning: React.FC<{
  reasoningMessageId: string;
  isCompletedStream: boolean;
  messageId: string;
}> = React.memo(({ reasoningMessageId, isCompletedStream, messageId }) => {
  const lastMessageTitle = useMessageIndividual(
    messageId,
    (x) => x?.reasoning_messages?.[reasoningMessageId]?.title
  );
  const finalReasoningMessage = useMessageIndividual(messageId, (x) => x?.final_reasoning_message);
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFileType);
  const isReasonginFileSelected = selectedFileType === 'reasoning';

  const text: string = useMemo(() => {
    if (finalReasoningMessage) return finalReasoningMessage;
    return lastMessageTitle || 'Thinking...';
  }, [lastMessageTitle, finalReasoningMessage]);

  const onClickReasoning = useMemoizedFn(() => {
    onSetSelectedFile({
      type: 'reasoning',
      id: messageId
    });
  });

  return (
    <AnimatePresence initial={!isCompletedStream} mode="wait">
      <motion.div {...animations} key={text} className="mb-3.5 w-fit" onClick={onClickReasoning}>
        <ShimmerTextWithIcon
          text={text ?? ''}
          isCompletedStream={isCompletedStream}
          isSelected={isReasonginFileSelected}
        />
      </motion.div>
    </AnimatePresence>
  );
});

ChatResponseReasoning.displayName = 'ChatThoughts';

const ShimmerTextWithIcon = React.memo(
  ({
    text,
    isCompletedStream,
    isSelected
  }: {
    text: string;
    isCompletedStream: boolean;
    isSelected: boolean;
  }) => {
    if (isCompletedStream) {
      return (
        <div
          className={cn(
            'text-icon-color hover:text-foreground',
            'cursor-pointer',
            'flex w-fit items-center gap-1',
            isSelected && 'text-foreground'
          )}>
          <div>
            <Stars />
          </div>
          <Text variant="inherit">{text}</Text>
        </div>
      );
    }

    return (
      <div className={'text-icon-color flex cursor-pointer items-center gap-1'}>
        <div className={'text-icon-color'}>
          <Stars />
        </div>
        <ShimmerText text={text} />
      </div>
    );
  }
);
ShimmerTextWithIcon.displayName = 'ShimmerTextWithIcon';
