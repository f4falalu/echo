import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createStyles } from 'antd-style';
import { CircleSpinnerLoader } from '@/components/loaders/CircleSpinnerLoader';
import { AppMaterialIcons } from '@/components/icons';

const animationConfig = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 }
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
          'flex items-center justify-center transition-all delay-100 duration-300'
        )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={inProgress ? 'in-progress' : 'completed'}
            {...animationConfig}
            className={cx(
              styles.indicator,
              inProgress && 'in-progress',
              'flex items-center justify-center transition-all duration-300'
            )}>
            {inProgress ? (
              <CircleSpinnerLoader size={8} />
            ) : (
              <AppMaterialIcons className="" icon="check" size={6} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  });

StatusIndicator.displayName = 'StatusIndicator';

const useStyles = createStyles(({ token, css }) => ({
  indicatorContainer: css`
    width: 10px;
    height: 10px;
    background-color: ${token.colorTextPlaceholder};
    border-radius: 100%;

    &.in-progress {
      background-color: transparent;
    }
  `,
  indicator: css`
    color: white;
    padding: 1px;
    border-radius: 100%;
    background-color: ${token.colorTextPlaceholder};
    box-shadow: 0 0 0 0.7px white inset;

    &.in-progress {
      background-color: transparent;
      box-shadow: none;
    }
  `
}));
