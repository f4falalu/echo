import React from 'react';
import type { BusterChatMessageReasoning_pills } from '@/api/asset_interfaces';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { ReasoningMessagePillContainer } from './ReasoningMessagePillContainer';
import { BarContainer } from '../BarContainer';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: {
    opacity: 0,
    height: 0
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1] // Smooth easeInOutQuart
      },
      opacity: {
        duration: 0.62,
        ease: [0.34, 1.56, 0.64, 1] // Bouncy easeOutBack
      }
    }
  }
};

export const ReasoningMessage_PillsContainer: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessage, isCompletedStream, isLastMessageItem }) => {
    const { title, secondary_title, pill_containers, status, id } =
      reasoningMessage as BusterChatMessageReasoning_pills;

    const hasPills = !!pill_containers && pill_containers.length > 0;
    const loadingStatus: NonNullable<BusterChatMessageReasoning_pills['status']> =
      (status ?? (isLastMessageItem && !isCompletedStream)) ? status || 'loading' : 'completed';

    return (
      <BarContainer
        showBar={hasPills || !isLastMessageItem}
        status={loadingStatus}
        isCompletedStream={isCompletedStream}
        title={title}
        secondaryTitle={secondary_title}
        contentClassName="mb-3">
        {hasPills && (
          <motion.div
            variants={containerVariants}
            initial={!isCompletedStream ? 'hidden' : false}
            animate="visible"
            className="flex flex-col space-y-3">
            {pill_containers.map((pill_container, index) => (
              <motion.div key={index} variants={itemVariants}>
                <ReasoningMessagePillContainer
                  key={index}
                  pillContainer={pill_container}
                  isCompletedStream={isCompletedStream}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </BarContainer>
    );
  }
);

ReasoningMessage_PillsContainer.displayName = 'ReasoningMessage_PillsContainer';
