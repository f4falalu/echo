import React, { useState, useRef, useMemo } from 'react';
import type { BusterChatMessageResponse } from '@/api/asset_interfaces';
import { createStyles } from 'antd-style';
import {
  ChatResponseMessageSelector,
  ChatResponseMessageSelectorProps
} from './ChatResponseMessageSelector';
import { AnimatePresence, motion } from 'framer-motion';
import { Text } from '@/components/text';
import { AppMaterialIcons } from '@/components';
import pluralize from 'pluralize';
import { useMemoizedFn } from 'ahooks';

const messageAnimationConfig = {
  initial: { opacity: 0, height: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.25, ease: 'easeOut' },
      opacity: { duration: 0.175, ease: 'easeOut' }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.25, ease: 'easeIn' },
      opacity: { duration: 0.175, ease: 'easeIn' }
    }
  }
};

export const ChatResponseMessageHidden: React.FC<{
  hiddenItems: BusterChatMessageResponse[];
  isCompletedStream: boolean;
}> = React.memo(({ hiddenItems, isCompletedStream }) => {
  const { styles, cx } = useStyles();
  const [isHidden, setIsHidden] = useState(true);

  const onToggleHidden = useMemoizedFn(() => {
    setIsHidden(!isHidden);
  });

  return (
    <motion.div className={cx('hidden-card', styles.hiddenCard)}>
      <HideButton onClick={onToggleHidden} numerOfItems={hiddenItems.length} isHidden={isHidden} />
      <AnimatePresence initial={false}>
        {!isHidden && (
          <motion.div className={styles.motionContainer} {...messageAnimationConfig}>
            {hiddenItems.map((item) => (
              <ChatResponseMessageSelector
                key={item.id}
                responseMessage={item}
                isCompletedStream={isCompletedStream}
                isLastMessageItem={false}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

const hideAnimationConfig = {
  initial: { opacity: 1, scaleY: 0 },
  animate: { opacity: 1, scaleY: 1 },
  exit: { opacity: 1, scaleY: 0 },
  transition: { duration: 0.125, ease: 'easeOut' }
};

const HideButton: React.FC<{ onClick: () => void; numerOfItems: number; isHidden: boolean }> = ({
  onClick,
  numerOfItems,
  isHidden
}) => {
  const { styles, cx } = useStyles();
  const text = useMemo(
    () =>
      isHidden
        ? `View ${numerOfItems} more ${pluralize('action', numerOfItems)}`
        : `Hide ${numerOfItems} ${pluralize('action', numerOfItems)}`,
    [isHidden, numerOfItems]
  );
  const icon = isHidden ? 'unfold_more' : 'unfold_less';

  return (
    <div className="mb-1 flex flex-col">
      <div
        className={cx('ml-1 flex w-fit cursor-pointer items-center space-x-1', styles.hideButton)}
        onClick={onClick}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isHidden ? 'hidden' : 'visible'}
            className={cx('flex w-4 min-w-4 items-center justify-center', styles.unfoldIcon)}
            {...hideAnimationConfig}>
            <AppMaterialIcons size={12} icon={icon} />
          </motion.div>
        </AnimatePresence>
        <Text className="pointer-events-none select-none">{text}</Text>
      </div>
    </div>
  );
};

ChatResponseMessageHidden.displayName = 'ChatResponseMessageHidden';

const useStyles = createStyles(({ token, css }) => ({
  hiddenCard: css`
    margin-bottom: 4px;
  `,
  motionContainer: css`
    overflow: hidden;
  `,
  unfoldIcon: css`
    color: ${token.colorIcon};
  `,
  hideButton: css`
    border-radius: ${token.borderRadius}px;
    background: transparent;
    padding: 1px 6px 1px 4px;

    &:hover {
      background: ${token.controlItemBgActive};
    }
  `
}));
