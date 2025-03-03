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
          className="absolute flex w-full justify-center"
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.12 }}
          style={{
            bottom: 28
          }}>
          <div className="bg-background rounded-[6px] p-[4px] shadow">
            {show && <>{children}</>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const PopupSplitter: React.FC = () => {
  return <div className="bg-border h-[17px] w-[0.5px]" />;
};
