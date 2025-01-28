import { BusterChatMessage_thought } from '@/api/buster_socket/chats';
import React from 'react';
import { ChatResponseMessageProps } from '../ChatResponseMessages';
import { AnimatePresence, motion } from 'framer-motion';
import { animationConfig } from '../animationConfig';
import { Text } from '@/components/text';
import { createStyles } from 'antd-style';
import { PillContainer } from './ChatResponseMessage_ThoughtPills';
import { StatusIndicator } from './StatusIndicator';
import { VerticalBar } from './VerticalBar';

export const ChatResponseMessage_Thought: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage: responseMessageProp, isCompletedStream, isLastMessageItem }) => {
    const responseMessage = responseMessageProp as BusterChatMessage_thought;
    const { thought_title, thought_secondary_title, thought_pills, in_progress } = responseMessage;
    const { cx } = useStyles();
    const hasPills = thought_pills && thought_pills.length > 0;

    const showLoadingIndicator = in_progress ?? (isLastMessageItem && !isCompletedStream);

    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div className={cx('relative flex space-x-1.5')} {...animationConfig}>
          <div className="flex w-4 min-w-4 flex-col items-center pt-0.5">
            <StatusIndicator inProgress={showLoadingIndicator} />
            <VerticalBar inProgress={in_progress} hasPills={hasPills} />
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

const useStyles = createStyles(({ token, css }) => ({}));
