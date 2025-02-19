import { BusterChatMessageReasoning } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import last from 'lodash/last';
import { ShimmerText } from '@/components/text';
import { useMemoizedFn } from 'ahooks';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { AppMaterialIcons, Text } from '@/components';
import { createStyles } from 'antd-style';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';

const animations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

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
    if (!lastMessage) return 'Thinking...';

    switch (lastMessage.type) {
      case 'text':
        return lastMessage.message;
      case 'thought':
        return lastMessage.thought_title;
      case 'file':
        return lastMessage.file_name;
      default:
        const _exhaustiveCheck: never = lastMessage;
        return 'Thinking...';
    }
  }, [lastMessage]);

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
          text={text}
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
