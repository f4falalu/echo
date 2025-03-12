import { DoubleChevronRight } from '@/components/ui/icons';
import { Button } from '@/components/ui/buttons';
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemoizedFn } from '@/hooks';

export const CollapseFileButton: React.FC<{
  showCollapseButton: boolean;
  onCollapseFileClick: (value?: boolean) => void;
}> = React.memo(({ showCollapseButton, onCollapseFileClick }) => {
  const icon = <DoubleChevronRight />;

  const onClick = useMemoizedFn(() => {
    onCollapseFileClick();
  });

  const animation = useMemo(() => {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    };
  }, []);

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
