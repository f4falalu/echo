import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createStyles } from 'antd-style';
import { CircleSpinnerLoader } from '@/components/loaders/CircleSpinnerLoader';
import { AppMaterialIcons } from '@/components/icons';

const animationConfig = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const StatusIndicator: React.FC<{ status?: 'completed' | 'loading' | 'failed' }> =
  React.memo(({ status }) => {
    const { styles, cx } = useStyles();
    const inProgress = status === 'loading';

    return (
      <div
        className={cx(
          styles.indicatorContainer,
          inProgress && 'in-progress',
          'relative flex items-center justify-center transition-all delay-100 duration-300'
        )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={inProgress ? 'in-progress' : 'completed'}
            {...animationConfig}
            className={cx(
              inProgress && 'in-progress',
              'ml-[0.5px] flex items-center justify-center transition-all duration-300'
            )}>
            {inProgress ? (
              <CircleSpinnerLoader size={8} />
            ) : (
              <AppMaterialIcons icon="circle_with_ring" size={10} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  });

StatusIndicator.displayName = 'StatusIndicator';

const useStyles = createStyles(({ token, css }) => ({
  indicatorContainer: css`
    width: 11px;
    height: 11px;
    border-radius: 100%;

    color: ${token.colorTextPlaceholder};
  `
}));
