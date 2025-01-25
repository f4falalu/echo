import React from 'react';
import { useChatSplitterContextSelector } from '../ChatLayoutContext';
import { AnimatePresence, motion } from 'framer-motion';

interface FileContainerProps {}

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 }
};

export const FileContainer: React.FC<FileContainerProps> = React.memo(({}) => {
  const selectedFileId = useChatSplitterContextSelector((state) => state.selectedFileId);
  const selectedFileType = useChatSplitterContextSelector((state) => state.selectedFileType);

  const hasFile = !!selectedFileId;

  return (
    <div className="h-full w-full bg-blue-300">
      <AnimatePresence mode="wait" initial={false}>
        {hasFile ? (
          <motion.div key={'file-container'} {...animation} className={`h-full w-full`}>
            <div
              className={`h-[300px] w-[200px] ${selectedFileType === 'metric' ? 'bg-green-500' : 'bg-red-500'}`}>
              {selectedFileType}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

FileContainer.displayName = 'FileContainer';
