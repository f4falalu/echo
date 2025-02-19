import { AppMaterialIcons } from '@/components/icons';
import { Button } from 'antd';
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemoizedFn } from 'ahooks';

export const CollapseFileButton: React.FC<{
  showCollapseButton: boolean;
  isOpen: boolean;
  collapseDirection: 'left' | 'right';
  onCollapseFileClick: (value?: boolean) => void;
}> = React.memo(({ showCollapseButton, isOpen, collapseDirection, onCollapseFileClick }) => {
  const icon = useMemo(() => {
    if (collapseDirection === 'left') {
      return isOpen ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right';
    }
    return isOpen ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left';
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
          <Button onClick={onClick} type="text" icon={<AppMaterialIcons icon={icon} />}></Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CollapseFileButton.displayName = 'CollapseFileButton';
