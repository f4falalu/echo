import { Text } from '@/components/text';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatContextSelector } from '../../ChatContext';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 }
};

export const ChatHeaderTitle: React.FC<{}> = React.memo(() => {
  const chatTitle = useChatContextSelector((state) => state.chatTitle);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div {...animation} key={chatTitle} className="flex items-center">
        <Text>{chatTitle}</Text>
      </motion.div>
    </AnimatePresence>
  );
});

ChatHeaderTitle.displayName = 'ChatHeaderTitle';
