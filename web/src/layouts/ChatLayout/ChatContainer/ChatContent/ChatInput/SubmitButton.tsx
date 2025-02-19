import React, { useState } from 'react';
import { AppMaterialIcons } from '@/components/icons';
import { createStyles } from 'antd-style';
import { AnimatePresence, motion } from 'framer-motion';
import { AppTooltip } from '@/components';

interface SubmitButtonProps {
  disableSendButton: boolean;
  loading: boolean;
  onSubmitPreflight: () => void;
}

const animationIcon = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
};

const buttonAnimation = {
  whileHover: { scale: 1.085 },
  whileTap: { scale: 0.9 },
  transition: { duration: 0.24, ease: 'easeInOut' }
};

export const SubmitButton: React.FC<SubmitButtonProps> = React.memo(
  ({ disableSendButton, loading, onSubmitPreflight }) => {
    const { styles } = useStyles();

    const tooltipText = loading ? 'Stop' : 'Send message';
    const tooltipShortcuts = loading ? [] : ['⌘', '↵'];

    return (
      <AppTooltip
        title={tooltipText}
        shortcuts={tooltipShortcuts}
        mouseEnterDelay={1.75}
        mouseLeaveDelay={0}>
        <motion.button
          onClick={onSubmitPreflight}
          disabled={disableSendButton}
          className={`${styles.button} ${loading ? styles.loading : ''} ${
            disableSendButton ? styles.disabled : ''
          }`}
          {...(!disableSendButton && buttonAnimation)}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" {...animationIcon} className={styles.iconWrapper}>
                <AppMaterialIcons icon="stop" fill size={16} />
              </motion.div>
            ) : (
              <motion.div key="arrow" {...animationIcon} className={styles.iconWrapper}>
                <AppMaterialIcons icon="arrow_upward" size={16} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </AppTooltip>
    );
  }
);

SubmitButton.displayName = 'SubmitButton';

const useStyles = createStyles(({ token, css }) => ({
  button: css`
    width: 26px;
    height: 26px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: ${token.colorBgContainer};
    border: 0.5px solid ${token.colorBorder};
    padding: 0;
    outline: none;
    transition: all 0.2s ease-in-out;

    &:not(:disabled):hover {
      border-color: ${token.colorPrimary};
      box-shadow: ${token.boxShadowTertiary};
    }

    &:disabled {
      cursor: not-allowed;
    }
  `,
  disabled: css`
    background: transparent;
    border: 0.5px solid ${token.colorBorderSecondary};

    .material-symbols {
      color: ${token.colorTextTertiary} !important;
    }
  `,
  loading: css`
    background: ${token.colorText} !important;
    border: 0.5px solid ${token.colorText} !important;
    color: ${token.colorBgLayout};

    &:hover {
      background: ${token.colorTextSecondary} !important;
      border-color: ${token.colorTextSecondary} !important;
    }

    .material-symbols {
      color: ${token.colorBgLayout} !important;
    }
  `,
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    .material-symbols {
      color: ${token.colorText};
    }
  `
}));
