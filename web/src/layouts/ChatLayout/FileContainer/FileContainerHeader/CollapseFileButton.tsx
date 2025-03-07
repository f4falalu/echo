import { DoubleChevronRight, DoubleChevronLeft } from '@/components/ui/icons';
import { Button } from '@/components/ui/buttons';
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemoizedFn } from '@/hooks';

export const CollapseFileButton: React.FC<{
  showCollapseButton: boolean;
  isOpen: boolean;
  collapseDirection: 'left' | 'right';
  onCollapseFileClick: (value?: boolean) => void;
}> = React.memo(({ showCollapseButton, isOpen, collapseDirection, onCollapseFileClick }) => {
  const icon = useMemo(() => {
    if (collapseDirection === 'left') {
      return isOpen ? <DoubleChevronLeft /> : <DoubleChevronRight />;
    }
    return isOpen ? <DoubleChevronRight /> : <DoubleChevronLeft />;
  }, [isOpen, collapseDirection]);

  const onClick = useMemoizedFn(() => {
    onCollapseFileClick();
  });

  const animation = useMemo(() => {
    const baseAnimation = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    };

    return baseAnimation;
  }, [collapseDirection, isOpen]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showCollapseButton && (
        <motion.div variants={animation}>
          <Button onClick={onClick} variant="ghost" prefix={icon}></Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CollapseFileButton.displayName = 'CollapseFileButton';
