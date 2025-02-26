import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RadioChecked, Radio, CircleWarning } from '../icons';
import { cn } from '@/lib/classMerge';

const animationConfig = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const StatusIndicator: React.FC<{ status?: 'completed' | 'loading' | 'failed' }> =
  React.memo(({ status }) => {
    const inProgress = status === 'loading';
    const failed = status === 'failed';

    return (
      <div
        className={cn(
          'text-gray-light relative flex h-[11px] w-[11px] items-center justify-center rounded-full transition-all duration-300',
          inProgress && 'text-primary',
          failed && 'text-danger-foreground'
        )}>
        <AnimatePresence mode="wait">
          <motion.div
            {...animationConfig}
            key={status === 'failed' ? 'failed' : 'completed'}
            className={cn('ml-[0.5px] flex items-center justify-center')}>
            {failed ? <CircleWarning /> : <RadioChecked />}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  });

StatusIndicator.displayName = 'StatusIndicator';
