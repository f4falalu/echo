import type { BusterChatMessageReasoning_Pill } from '@/api/asset_interfaces';
import { createStyles } from 'antd-style';
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemoizedFn } from 'ahooks';
import { Popover } from '@/components/ui/tooltip/Popover';
import {
  isOpenableFile,
  useChatLayoutContextSelector
} from '@/layouts/ChatLayout/ChatLayoutContext';
import { type SelectedFile } from '@/layouts/ChatLayout/interfaces';

const duration = 0.25;

const containerVariants = {
  hidden: {
    height: 0
  },
  visible: {
    height: 'auto',
    transition: {
      duration: duration,
      staggerChildren: 0.035,
      delayChildren: 0.075
    }
  }
};

const pillVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: duration
    }
  }
};

export const PillContainer: React.FC<{
  pills: BusterChatMessageReasoning_Pill[];
  isCompletedStream: boolean;
}> = React.memo(({ pills = [], isCompletedStream }) => {
  const { cx } = useStyles();
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);

  const useAnimation = !isCompletedStream;

  const handlePillClick = useMemoizedFn(
    (pill: Pick<BusterChatMessageReasoning_Pill, 'id' | 'type'>) => {
      if (isOpenableFile(pill.type)) {
        onSetSelectedFile(pill as SelectedFile);
      }
    }
  );

  const isClickablePill = useMemo(() => {
    return pills.some((pill) => isOpenableFile(pill.type));
  }, [pills]);

  const onClick = isClickablePill ? handlePillClick : undefined;

  return (
    <AnimatePresence initial={!isCompletedStream}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={pills.length > 0 ? 'visible' : 'hidden'}
        className={cx('flex w-full flex-wrap gap-1.5 overflow-hidden')}>
        {pills.map((pill) => (
          <Pill key={pill.id} useAnimation={useAnimation} {...pill} onClick={onClick} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
});

PillContainer.displayName = 'PillContainer';

const Pill: React.FC<{
  text: string;
  id?: string;
  type?: BusterChatMessageReasoning_Pill['type'];
  useAnimation: boolean;
  className?: string;
  onClick?: (pill: Pick<BusterChatMessageReasoning_Pill, 'id' | 'type'>) => void;
}> = React.memo(({ text, type, id, useAnimation, className = '', onClick }) => {
  const { styles, cx } = useStyles();
  return (
    <AnimatePresence initial={useAnimation}>
      <motion.div
        onClick={() => !!id && !!type && onClick?.({ id, type })}
        variants={pillVariants}
        className={cx(
          styles.pill,
          className,
          !!onClick && 'cursor-pointer',
          'flex items-center justify-center whitespace-nowrap'
        )}>
        {text}
      </motion.div>
    </AnimatePresence>
  );
});

Pill.displayName = 'Pill';

const OverflowPill = React.memo(
  ({
    hiddenPills,
    useAnimation,
    onClickPill
  }: {
    hiddenPills: BusterChatMessageReasoning_Pill[];
    useAnimation: boolean;
    onClickPill: (pill: Pick<BusterChatMessageReasoning_Pill, 'id' | 'type'>) => void;
  }) => {
    const count = hiddenPills.length;

    const content = (
      <div className="flex max-w-[400px] flex-wrap gap-1">
        {hiddenPills.map((pill) => (
          <Pill key={pill.id} useAnimation={useAnimation} {...pill} onClick={undefined} />
        ))}
      </div>
    );

    return (
      <Popover size={'sm'} content={content}>
        <div>
          <Pill className="cursor-pointer" useAnimation={useAnimation} text={`+${count} more`} />
        </div>
      </Popover>
    );
  }
);

OverflowPill.displayName = 'OverflowPill';

const useStyles = createStyles(({ token, css }) => ({
  pill: css`
    color: ${token.colorTextSecondary};
    background-color: ${token.controlItemBgActive};
    border: 0.5px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    padding: 0px 4px;
    height: 18px;
    min-height: 18px;
    font-size: 11px;
    &.cursor-pointer {
      &:hover {
        background-color: ${token.controlItemBgActiveHover};
      }
    }
  `
}));
