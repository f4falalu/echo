import { BusterChatMessage_thought } from '@/api/asset_interfaces';
import React, { useRef } from 'react';
import { ChatResponseMessageProps } from '../ChatResponseMessageSelector';
import { AnimatePresence, motion } from 'framer-motion';
import { itemAnimationConfig } from '../animationConfig';
import { Text } from '@/components/text';
import { PillContainer } from './ChatResponseMessage_ThoughtPills';
import { StatusIndicator } from '../StatusIndicator';
import { VerticalBar } from './VerticalBar';
import { createStyles } from 'antd-style';

export const ChatResponseMessage_Thought: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage: responseMessageProp, isCompletedStream, isLastMessageItem }) => {
    const responseMessage = responseMessageProp as BusterChatMessage_thought;
    const { thought_title, thought_secondary_title, thought_pills, status } = responseMessage;
    const hasPills = thought_pills && thought_pills.length > 0;

    const showLoadingIndicator =
      (status ?? (isLastMessageItem && !isCompletedStream)) ? 'loading' : 'completed';
    const inProgress = showLoadingIndicator === 'loading';

    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div
          className={'relative flex space-x-1.5 overflow-hidden'}
          {...itemAnimationConfig}>
          <BarContainer
            inProgress={inProgress}
            hasPills={hasPills}
            showLoadingIndicator={showLoadingIndicator}
          />
          <div className="flex w-full flex-col space-y-2 overflow-hidden">
            <TextContainer
              thought_title={thought_title}
              thought_secondary_title={thought_secondary_title}
            />
            <PillContainer pills={thought_pills} isCompletedStream={isCompletedStream} />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

ChatResponseMessage_Thought.displayName = 'ChatResponseMessage_Thought';

const BarContainer: React.FC<{
  inProgress: boolean;
  hasPills: boolean | undefined;
  showLoadingIndicator: 'loading' | 'completed';
}> = React.memo(({ inProgress, hasPills, showLoadingIndicator }) => {
  return (
    <div className="ml-2 flex w-4 min-w-4 flex-col items-center pt-0.5">
      <StatusIndicator status={showLoadingIndicator} />
      <VerticalBar inProgress={inProgress} hasPills={hasPills} />
    </div>
  );
});

BarContainer.displayName = 'BarContainer';

const TextContainer: React.FC<{
  thought_title: string;
  thought_secondary_title: string;
}> = React.memo(({ thought_title, thought_secondary_title }) => {
  const { styles, cx } = useStyles();

  return (
    <div
      className={cx(
        styles.hideSecondaryText,
        'flex w-full items-center space-x-1.5 overflow-hidden'
      )}>
      <Text size="sm" className="whitespace-nowrap">
        {thought_title}
      </Text>
      <Text size="sm" type="tertiary" className="secondary-text truncate">
        {thought_secondary_title}
      </Text>
    </div>
  );
});

TextContainer.displayName = 'TextContainer';

const useStyles = createStyles(({ css }) => ({
  hideSecondaryText: css`
    container-type: inline-size;
    @container (max-width: 170px) {
      .secondary-text {
        display: none;
      }
    }
  `
}));
