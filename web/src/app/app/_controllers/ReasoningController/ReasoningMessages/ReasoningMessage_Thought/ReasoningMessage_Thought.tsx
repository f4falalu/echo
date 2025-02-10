import type { BusterChatMessageReasoning_thought } from '@/api/asset_interfaces';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { itemAnimationConfig } from '../animationConfig';
import { Text } from '@/components/text';
import { StatusIndicator } from '@/components/indicators';
import { VerticalBar } from './VerticalBar';
import { createStyles } from 'antd-style';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { ReasoningMessage_ThoughtContainer } from './ReasoningMessage_ThoughtContainer';

export const ReasoningMessage_Thought: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessage, isCompletedStream, isLastMessageItem }) => {
    const { thought_title, thought_secondary_title, thoughts, status, id } =
      reasoningMessage as BusterChatMessageReasoning_thought;

    const hasThoughts = !!thoughts && thoughts.length > 0;
    const showLoadingIndicator =
      (status ?? (isLastMessageItem && !isCompletedStream)) ? 'loading' : 'completed';

    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div
          className={'relative flex space-x-1.5 overflow-hidden'}
          {...itemAnimationConfig}>
          <BarContainer hasThoughts={hasThoughts} showLoadingIndicator={showLoadingIndicator} />
          <div className="mb-2.5 flex w-full flex-col space-y-2 overflow-hidden">
            <TextContainer
              thought_title={thought_title}
              thought_secondary_title={thought_secondary_title}
            />
            {hasThoughts &&
              thoughts.map((thought, index) => (
                <ReasoningMessage_ThoughtContainer
                  key={index}
                  thought={thought}
                  isCompletedStream={isCompletedStream}
                />
              ))}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

ReasoningMessage_Thought.displayName = 'ReasoningMessage_Thought';

const BarContainer: React.FC<{
  hasThoughts: boolean;
  showLoadingIndicator: 'loading' | 'completed';
}> = React.memo(({ hasThoughts, showLoadingIndicator }) => {
  return (
    <div className="ml-2 flex w-4 min-w-4 flex-col items-center">
      <StatusIndicator status={showLoadingIndicator} />
      <VerticalBar show={hasThoughts} />
    </div>
  );
});

BarContainer.displayName = 'BarContainer';

const TextContainer: React.FC<{
  thought_title: string;
  thought_secondary_title: string;
}> = React.memo(({ thought_title, thought_secondary_title }) => {
  const { styles, cx } = useStyles();
  const lineHeight = 13;

  return (
    <div
      className={cx(
        styles.hideSecondaryText,
        'flex w-full items-center space-x-1.5 overflow-hidden'
      )}>
      <Text size="sm" className="whitespace-nowrap" lineHeight={lineHeight}>
        {thought_title}
      </Text>
      <Text size="sm" type="tertiary" className="secondary-text truncate" lineHeight={lineHeight}>
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
