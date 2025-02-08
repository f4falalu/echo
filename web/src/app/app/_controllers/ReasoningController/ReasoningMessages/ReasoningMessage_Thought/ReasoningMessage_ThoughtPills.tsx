import type {
  BusterChatMessageReasoning_thought,
  BusterChatMessageReasoning_thoughtPill
} from '@/api/asset_interfaces';
import { createStyles } from 'antd-style';
import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemoizedFn } from 'ahooks';
import { AppPopover } from '@/components';
import { PopoverProps } from 'antd';
import { isOpenableFile, SelectedFile, useChatLayoutContextSelector } from '@appLayouts/ChatLayout';

const duration = 0.25;

const containerVariants = {
  hidden: {
    height: 0,
    marginBottom: 0
  },
  visible: {
    height: 'auto',
    marginBottom: '8px',
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
  pills: BusterChatMessageReasoning_thought['thought_pills'];
  isCompletedStream: boolean;
}> = React.memo(({ pills = [], isCompletedStream }) => {
  const { cx } = useStyles();
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);

  const useAnimation = !isCompletedStream;

  const handlePillClick = useMemoizedFn(
    (pill: Pick<BusterChatMessageReasoning_thoughtPill, 'id' | 'type'>) => {
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
  type?: BusterChatMessageReasoning_thoughtPill['type'];
  useAnimation: boolean;
  className?: string;
  onClick?: (pill: Pick<BusterChatMessageReasoning_thoughtPill, 'id' | 'type'>) => void;
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

const memoizedTrigger: PopoverProps['trigger'] = ['click'];
const OverflowPill = React.memo(
  ({
    hiddenPills,
    useAnimation,
    onClickPill
  }: {
    hiddenPills: BusterChatMessageReasoning_thoughtPill[];
    useAnimation: boolean;
    onClickPill: (pill: Pick<BusterChatMessageReasoning_thoughtPill, 'id' | 'type'>) => void;
  }) => {
    const count = hiddenPills.length;

    const content = (
      <div className="flex max-w-[400px] flex-wrap gap-1 p-1.5">
        {hiddenPills.map((pill) => (
          <Pill key={pill.id} useAnimation={useAnimation} {...pill} onClick={undefined} />
        ))}
      </div>
    );

    return (
      <AppPopover destroyTooltipOnHide content={content} trigger={memoizedTrigger}>
        <div>
          <Pill className="cursor-pointer" useAnimation={useAnimation} text={`+${count} more`} />
        </div>
      </AppPopover>
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
    font-size: 11px;
    &.cursor-pointer {
      &:hover {
        background-color: ${token.controlItemBgActiveHover};
      }
    }
  `
}));
