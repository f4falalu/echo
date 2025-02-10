import { BusterChatMessageReasoning_thoughtPillContainer } from '@/api/asset_interfaces';
import React from 'react';
import { Text } from '@/components/text';
import { PillContainer } from './ReasoningMessage_ThoughtPills';
import { itemAnimationConfig } from '../animationConfig';
import { AnimatePresence, motion } from 'framer-motion';

export const ReasoningMessage_ThoughtContainer: React.FC<{
  thought: BusterChatMessageReasoning_thoughtPillContainer;
  isCompletedStream: boolean;
}> = React.memo(({ thought, isCompletedStream }) => {
  return (
    <AnimatePresence initial={!isCompletedStream}>
      <motion.div {...itemAnimationConfig}>
        <div className="flex flex-col space-y-1">
          <Text size="xs" type="tertiary">
            {thought.title}
          </Text>
          <PillContainer pills={thought.thought_pills} isCompletedStream={isCompletedStream} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

ReasoningMessage_ThoughtContainer.displayName = 'ReasoningMessage_ThoughtContainer';
