import { Text } from '@/components/text';
import React from 'react';
import { useChatSplitterContextSelector } from '../../ChatSplitterContext';
import { AnimatePresence, motion } from 'framer-motion';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 }
};

export const ChatHeaderTitle: React.FC<{}> = React.memo(() => {
  const selectedFileTitle = useChatSplitterContextSelector((state) => state.selectedFileTitle);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div {...animation} key={selectedFileTitle} className="flex items-center">
        <Text>{selectedFileTitle}</Text>
      </motion.div>
    </AnimatePresence>
  );
});

ChatHeaderTitle.displayName = 'ChatHeaderTitle';
