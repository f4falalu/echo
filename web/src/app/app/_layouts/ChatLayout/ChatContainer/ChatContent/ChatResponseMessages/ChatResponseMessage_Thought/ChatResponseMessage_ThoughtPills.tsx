import type {
  BusterChatMessage_thought,
  BusterChatMessage_thoughtPill
} from '@/api/asset_interfaces';
import { createStyles } from 'antd-style';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { calculateTextWidth } from '@/utils';
import { useDebounce, useMemoizedFn, useSize } from 'ahooks';
import { AppPopover } from '@/components';
import { useChatLayoutContextSelector } from '../../../../ChatLayoutContext';

const duration = 0.25;

const containerVariants = {
  hidden: {
    height: 0
  },
  visible: {
    height: '28px',
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

const pillPadding = 8; // 4px left + 4px right
const pillMargin = 6; // 1.5 * 4 for gap
const pillBorder = 1; // 0.5px * 2
const font = '11px -apple-system, BlinkMacSystemFont, sans-serif'; // Match your app's font

export const PillContainer: React.FC<{
  pills: BusterChatMessage_thought['thought_pills'];
  isCompletedStream: boolean;
}> = React.memo(({ pills = [], isCompletedStream }) => {
  const { cx } = useStyles();
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
  const [visiblePills, setVisiblePills] = useState<BusterChatMessage_thoughtPill[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [hasDoneInitialAnimation, setHasDoneInitialAnimation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const useAnimation = !hasDoneInitialAnimation && !isCompletedStream;

  const size = useSize(containerRef);
  const thoughtContainerWidth = size?.width;
  const debouncedWidth = useDebounce(thoughtContainerWidth, {
    wait: 25,
    maxWait: 75,
    leading: true
  });

  const hiddenPills: BusterChatMessage_thoughtPill[] = useMemo(() => {
    return pills.slice(visiblePills.length, visiblePills.length + hiddenCount);
  }, [pills, visiblePills, hiddenCount]);

  const handlePillClick = useMemoizedFn(
    (pill: Pick<BusterChatMessage_thoughtPill, 'id' | 'type'>) => {
      onSetSelectedFile(pill);
    }
  );

  const moreTextWidth = useMemo(() => {
    return calculateTextWidth('+99 more', font) + pillPadding + pillBorder;
  }, [font]);

  useLayoutEffect(() => {
    if (!pills || !containerRef.current) return;

    const containerWidth = thoughtContainerWidth || 240;

    let currentLineWidth = 0;
    const visible: BusterChatMessage_thoughtPill[] = [];
    let hidden = 0;

    for (let i = 0; i < pills.length; i++) {
      const pill = pills[i];
      const textWidth = calculateTextWidth(pill.text, font);
      const pillWidth = textWidth + pillPadding + pillBorder;

      // Check if adding this pill would exceed container width
      if (
        currentLineWidth + pillWidth + (visible.length > 0 ? pillMargin : 0) + moreTextWidth <=
        containerWidth
      ) {
        visible.push(pill);
        currentLineWidth += pillWidth + (visible.length > 0 ? pillMargin : 0);
      } else {
        hidden++;
      }
    }

    setVisiblePills(visible);
    setHiddenCount(hidden);

    setTimeout(() => {
      visiblePills.length > 0 && setHasDoneInitialAnimation(true);
    }, 300);
  }, [pills, containerRef.current, debouncedWidth]);

  return (
    <AnimatePresence initial={!isCompletedStream}>
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={pills.length > 0 ? 'visible' : 'hidden'}
        className={cx('flex w-full flex-wrap flex-nowrap gap-1.5 overflow-hidden')}>
        {visiblePills.map((pill) => (
          <Pill key={pill.id} useAnimation={useAnimation} {...pill} onClick={undefined} />
        ))}
        {hiddenCount > 0 && (
          <OverflowPill
            hiddenPills={hiddenPills}
            useAnimation={useAnimation}
            onClickPill={handlePillClick}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
});

PillContainer.displayName = 'PillContainer';

const Pill: React.FC<{
  text: string;
  id?: string;
  type?: BusterChatMessage_thoughtPill['type'];
  useAnimation: boolean;
  className?: string;
  onClick?: (pill: Pick<BusterChatMessage_thoughtPill, 'id' | 'type'>) => void;
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
    hiddenPills: BusterChatMessage_thoughtPill[];
    useAnimation: boolean;
    onClickPill: (pill: Pick<BusterChatMessage_thoughtPill, 'id' | 'type'>) => void;
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
      <AppPopover destroyTooltipOnHide content={content} trigger={['click']}>
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
