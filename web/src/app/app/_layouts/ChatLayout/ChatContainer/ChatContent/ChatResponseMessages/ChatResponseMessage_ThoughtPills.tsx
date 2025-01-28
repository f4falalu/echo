import {
  BusterChatMessage_thought,
  BusterChatMessage_thoughtPill
} from '@/api/buster_socket/chats';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { calculateTextWidth } from '@/utils';
import { useDebounce, useSize } from 'ahooks';

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

export const PillContainer: React.FC<{ pills: BusterChatMessage_thought['thought_pills'] }> = ({
  pills = []
}) => {
  const { styles, cx } = useStyles();
  const [visiblePills, setVisiblePills] = useState<BusterChatMessage_thoughtPill[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [maxSeen, setMaxSeen] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const useAnimation = true;

  const size = useSize(containerRef);
  const debouncedWidth = useDebounce(size?.width, {
    wait: 320,
    leading: true
  });

  useEffect(() => {
    if (!containerRef.current || !pills) return;

    const containerWidth = containerRef.current.offsetWidth;
    const pillPadding = 8; // 4px left + 4px right
    const pillMargin = 6; // 1.5 * 4 for gap
    const pillBorder = 1; // 0.5px * 2
    const font = '11px -apple-system, BlinkMacSystemFont, sans-serif'; // Match your app's font

    let currentLineWidth = 0;
    const visible: BusterChatMessage_thoughtPill[] = [];
    let hidden = 0;

    // Calculate width needed for "+X more" pill
    const moreTextWidth = calculateTextWidth('+99 more', font) + pillPadding + pillBorder;

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
    setMaxSeen(visible.length);
  }, [pills, containerRef.current, debouncedWidth]);

  return (
    <AnimatePresence initial={true}>
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={visiblePills.length > 0 ? 'visible' : 'hidden'}
        className={cx('flex w-full flex-wrap flex-nowrap gap-1.5 overflow-hidden pb-2.5')}>
        {visiblePills.map((pill) => (
          <Pill key={pill.id} useAnimation={useAnimation}>
            {pill.text}
          </Pill>
        ))}
        {hiddenCount > 0 && <Pill useAnimation={useAnimation}>+{hiddenCount} more</Pill>}
      </motion.div>
    </AnimatePresence>
  );
};

const Pill: React.FC<{ children: React.ReactNode; useAnimation: boolean }> = ({
  children,
  useAnimation
}) => {
  const { styles, cx } = useStyles();
  return (
    <AnimatePresence initial={true}>
      <motion.div
        variants={pillVariants}
        className={cx(styles.pill, 'flex items-center justify-center truncate')}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

Pill.displayName = 'Pill';

const useStyles = createStyles(({ token, css }) => ({
  pill: {
    color: token.colorTextTertiary,
    backgroundColor: token.controlItemBgActive,
    border: `0.5px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusLG,
    padding: '0px 4px',
    height: '18px',
    fontSize: '11px'
  }
}));
