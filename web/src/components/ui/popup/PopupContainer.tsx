import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const PopupContainer: React.FC<{
  show: boolean;
  children: React.ReactNode;
}> = ({ show, children }) => {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className="absolute bottom-10 z-50 flex w-full justify-center"
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.12 }}>
          <div className="bg-background rounded px-2 py-1.5 shadow">{show && <>{children}</>}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const PopupSplitter: React.FC = () => {
  return <div className="bg-border h-[17px] w-[0.5px]" />;
};
