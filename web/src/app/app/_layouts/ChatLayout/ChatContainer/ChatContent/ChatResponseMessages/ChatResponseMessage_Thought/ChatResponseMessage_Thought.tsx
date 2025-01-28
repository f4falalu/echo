import { BusterChatMessage_thought } from '@/api/buster_socket/chats';
import React from 'react';
import { ChatResponseMessageProps } from '../ChatResponseMessages';
import { AnimatePresence, motion } from 'framer-motion';
import { animationConfig } from '../animationConfig';
import { Text } from '@/components/text';
import { createStyles } from 'antd-style';
import { PillContainer } from './ChatResponseMessage_ThoughtPills';
import { StatusIndicator } from '../StatusIndicator';
import { VerticalBar } from './VerticalBar';

export const ChatResponseMessage_Thought: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage: responseMessageProp, isCompletedStream, isLastMessageItem }) => {
    const responseMessage = responseMessageProp as BusterChatMessage_thought;
    const { thought_title, thought_secondary_title, thought_pills, status } = responseMessage;
    const { cx, styles } = useStyles();
    const hasPills = thought_pills && thought_pills.length > 0;

    const showLoadingIndicator =
      (status ?? (isLastMessageItem && !isCompletedStream)) ? 'loading' : 'completed';
    const inProgress = showLoadingIndicator === 'loading';

    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div
          className={cx(styles.thoughtCard, 'relative flex space-x-1.5', 'thought-card')}
          {...animationConfig}>
          <div className="ml-2 flex w-4 min-w-4 flex-col items-center pt-0.5">
            <StatusIndicator status={showLoadingIndicator} />
            <VerticalBar inProgress={inProgress} hasPills={hasPills} />
          </div>
          <div className="flex w-full flex-col space-y-2">
            <div className="flex w-full items-center space-x-1.5 overflow-hidden">
              <Text size="sm" className="truncate">
                {thought_title}
              </Text>
              <Text size="sm" type="tertiary">
                {thought_secondary_title}
              </Text>
            </div>

            <PillContainer pills={thought_pills} isCompletedStream={isCompletedStream} />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

ChatResponseMessage_Thought.displayName = 'ChatResponseMessage_Thought';

const useStyles = createStyles(({ token, css }) => ({
  thoughtCard: css`
    &.thought-card:has(+ .thought-card) {
      margin-bottom: 4px;
    }

    &.thought-card:has(+ .file-card) {
      margin-bottom: 4px;
    }
  `
}));
