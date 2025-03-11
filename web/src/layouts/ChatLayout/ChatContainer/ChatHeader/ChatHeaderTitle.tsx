'use client';

import { Text } from '@/components/ui/typography';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 }
};

export const ChatHeaderTitle: React.FC<{
  chatTitle: string;
}> = React.memo(({ chatTitle }) => {
  if (!chatTitle) return <div></div>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div {...animation} key={chatTitle} className="flex items-center overflow-hidden">
        <Text truncate>{chatTitle}</Text>
      </motion.div>
    </AnimatePresence>
  );
});

ChatHeaderTitle.displayName = 'ChatHeaderTitle';
