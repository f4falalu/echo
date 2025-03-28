import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RadioChecked, CircleWarning } from '../icons';
import { cn } from '@/lib/classMerge';

const animationConfig = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const StatusIndicator: React.FC<{
  status?: 'completed' | 'loading' | 'failed';
  isCompletedStream?: boolean;
}> = React.memo(({ status }) => {
  const inProgress = status === 'loading';
  const failed = status === 'failed';

  return (
    <div
      className={cn(
        'text-gray-light relative flex h-3 w-3 items-center justify-center rounded-full transition-all duration-300',
        inProgress && 'text-primary',
        failed && 'text-danger-foreground'
      )}>
      {inProgress && (
        <div className="bg-primary/30 absolute inset-0 -ml-[1px] animate-ping rounded-full duration-1000" />
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          {...animationConfig}
          key={status === 'failed' ? 'failed' : 'completed'}
          className={cn('flex items-center justify-center')}>
          {failed ? <CircleWarning /> : <RadioChecked />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

StatusIndicator.displayName = 'StatusIndicator';
