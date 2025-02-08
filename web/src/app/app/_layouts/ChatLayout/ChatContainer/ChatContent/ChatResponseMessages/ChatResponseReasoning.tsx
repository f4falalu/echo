import { BusterChatMessageReasoning } from '@/api/asset_interfaces';
import React, { useEffect, useMemo, useState } from 'react';
import last from 'lodash/last';
import { ShimmerText } from '@/components/text';
import { useMemoizedFn } from 'ahooks';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { AppMaterialIcons, Text } from '@/components';
import { createStyles } from 'antd-style';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';

export const ChatResponseReasoning: React.FC<{
  reasoningMessages: BusterChatMessageReasoning[];
  isCompletedStream: boolean;
  messageId: string;
}> = React.memo(({ reasoningMessages, isCompletedStream, messageId }) => {
  const lastMessage = last(reasoningMessages);
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFileType);
  const isReasonginFileSelected = selectedFileType === 'reasoning';

  const text = useMemo(() => {
    if (!lastMessage) return null;
    if (lastMessage.type === 'text') {
      return lastMessage.message;
    }
    return lastMessage.thought_title;
  }, [lastMessage]);

  const getRandomThought = useMemoizedFn(() => {
    return DEFAULT_THOUGHTS[Math.floor(Math.random() * DEFAULT_THOUGHTS.length)];
  });

  const onClickReasoning = useMemoizedFn(() => {
    onSetSelectedFile({
      type: 'reasoning',
      id: messageId
    });
  });

  const [thought, setThought] = useState(text || DEFAULT_THOUGHTS[0]);

  useEffect(() => {
    if (!isCompletedStream && !text) {
      const randomInterval = Math.floor(Math.random() * 3000) + 1200;
      const interval = setTimeout(() => {
        setThought(getRandomThought());
      }, randomInterval);
      return () => clearTimeout(interval);
    }
    if (text) {
      setThought(text);
    }
  }, [thought, isCompletedStream, text, getRandomThought]);

  const animations = useMemo(() => {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    };
  }, []);

  return (
    <AnimatePresence initial={!isCompletedStream} mode="wait">
      <motion.div {...animations} key={thought} className="mb-3.5 w-fit" onClick={onClickReasoning}>
        <ShimmerTextWithIcon
          text={thought}
          isCompletedStream={isCompletedStream}
          isSelected={isReasonginFileSelected}
        />
      </motion.div>
    </AnimatePresence>
  );
});

ChatResponseReasoning.displayName = 'ChatThoughts';

const DEFAULT_THOUGHTS = [
  'Thinking through next steps...',
  'Looking through context...',
  'Reflecting on the instructions...',
  'Analyzing available actions',
  'Reviewing the objective...',
  'Deciding feasible options...',
  'Sorting out some details...',
  'Exploring other possibilities...',
  'Confirming things....',
  'Mapping information across files...',
  'Making a few edits...',
  'Filling out arguments...',
  'Double-checking the logic...',
  'Validating my approach...',
  'Looking at a few edge cases...',
  'Ensuring everything aligns...',
  'Polishing the details...',
  'Making some adjustments...',
  'Writing out arguments...',
  'Mapping trends and patterns...',
  'Re-evaluating this step...',
  'Updating parameters...',
  'Evaluating available data...',
  'Reviewing all parameters...',
  'Processing relevant info...',
  'Aligning with user request...',
  'Gathering necessary details...',
  'Sorting through options...',
  'Editing my system logic...',
  'Cross-checking references...',
  'Validating my approach...',
  'Rewriting operational details...',
  'Mapping new information...',
  'Adjusting priorities & approach...',
  'Revisiting earlier inputs...',
  'Finalizing plan details...'
];

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
    const { cx, styles } = useStyles();

    if (isCompletedStream) {
      return (
        <div
          className={cx(
            styles.iconContainerCompleted,
            styles.iconContainer,
            'flex w-fit items-center gap-1',
            isSelected && 'is-selected'
          )}>
          <div>
            <AppMaterialIcons icon="stars" />
          </div>
          <Text type="inherit">{text}</Text>
        </div>
      );
    }

    return (
      <div className={cx(styles.iconContainer, 'flex items-center gap-1')}>
        <div className={cx(styles.icon)}>
          <AppMaterialIcons icon="stars" />
        </div>
        <ShimmerText text={text} />
      </div>
    );
  }
);
ShimmerTextWithIcon.displayName = 'ShimmerTextWithIcon';

const useStyles = createStyles(({ token, css }) => ({
  iconContainerCompleted: css`
    color: ${token.colorIcon};
    &:hover {
      color: ${token.colorText};
    }
    &.is-selected {
      color: ${token.colorText};
    }
  `,
  iconContainer: css`
    cursor: pointer;
  `,
  icon: css`
    color: ${token.colorIcon};
  `
}));
