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
  exit: { opacity: 0, scale: 0.8 }
};

export const SubmitButton: React.FC<SubmitButtonProps> = React.memo(
  ({ disableSendButton, onSubmitPreflight }) => {
    const { styles } = useStyles();

    const [loading, setLoading] = useState(false);

    const onTest = () => {
      setLoading(!loading);
    };

    const tooltipText = loading ? 'Stop' : 'Send message';
    const tooltipShortcuts = loading ? [] : ['⌘', '↵'];

    return (
      <AppTooltip title={tooltipText} shortcuts={tooltipShortcuts} mouseEnterDelay={1}>
        <button
          onClick={onTest}
          disabled={disableSendButton}
          className={`${styles.button} ${loading ? styles.loading : ''} ${
            disableSendButton ? styles.disabled : ''
          }`}>
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
        </button>
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
    transition: all 0.2s ease;
    background: ${token.colorBgContainer};
    border: 0.5px solid ${token.colorBorder};
    padding: 0;
    outline: none;

    .material-symbols {
      transition: color 0.2s ease;
    }

    &:not(:disabled):hover {
      border-color: ${token.colorPrimary};
      transform: scale(1.075);
      box-shadow: ${token.boxShadowTertiary};
    }

    &:not(:disabled):active {
      transform: scale(0.95);
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
    background: ${token.colorText};
    border: 0.5px solid ${token.colorBorder};
    color: ${token.colorBgLayout};

    &:hover {
      background: ${token.colorTextSecondary};
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
