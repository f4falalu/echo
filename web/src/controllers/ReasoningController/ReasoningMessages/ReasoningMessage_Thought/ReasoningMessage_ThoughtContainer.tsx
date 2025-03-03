import { BusterChatMessageReasoning_PillsContainer } from '@/api/asset_interfaces';
import React from 'react';
import { Text } from '@/components/ui';
import { PillContainer } from './ReasoningMessage_ThoughtPills';
import { itemAnimationConfig } from '../animationConfig';
import { AnimatePresence, motion } from 'framer-motion';

export const ReasoningMessage_ThoughtContainer: React.FC<{
  pillContainer: BusterChatMessageReasoning_PillsContainer;
  isCompletedStream: boolean;
}> = React.memo(({ pillContainer, isCompletedStream }) => {
  return (
    <AnimatePresence initial={!isCompletedStream}>
      <motion.div {...itemAnimationConfig}>
        <div className="flex flex-col space-y-1">
          <Text size="xs" type="tertiary">
            {pillContainer.title}
          </Text>
          <PillContainer pills={pillContainer.pills} isCompletedStream={isCompletedStream} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

ReasoningMessage_ThoughtContainer.displayName = 'ReasoningMessage_ThoughtContainer';
