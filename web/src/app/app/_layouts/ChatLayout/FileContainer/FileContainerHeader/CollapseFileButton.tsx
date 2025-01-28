import { AppMaterialIcons } from '@/components';
import { Button } from 'antd';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { useMemoizedFn } from 'ahooks';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const CollapseFileButton: React.FC<{
  showCollapseButton: boolean;
  isOpen: boolean;
}> = React.memo(({ showCollapseButton, isOpen }) => {
  const onCollapseFileClick = useChatLayoutContextSelector((state) => state.onCollapseFileClick);
  const icon = !isOpen ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right';

  const onClick = useMemoizedFn(() => {
    onCollapseFileClick();
  });

  return (
    <AnimatePresence mode="wait">
      {showCollapseButton && (
        <motion.div variants={animation}>
          <Button onClick={onClick} type="text" icon={<AppMaterialIcons icon={icon} />}></Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CollapseFileButton.displayName = 'CollapseFileButton';
