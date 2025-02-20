import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createStyles } from 'antd-style';

export const PopupContainer: React.FC<{
  show: boolean;
  children: React.ReactNode;
  secondaryChildren?: React.ReactNode;
}> = ({ show, children, secondaryChildren }) => {
  const { styles, cx } = useStyles();

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
          <div className={styles.container}>{show && <>{children}</>}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const PopupSplitter: React.FC<{}> = ({}) => {
  const { styles, cx } = useStyles();
  return <div className={styles.splitter} />;
};

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    background-color: ${token.colorBgContainer};
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowSecondary};
    padding: ${token.paddingXS}px;
  `,
  splitter: css`
    background-color: ${token.colorSplit};
    height: ${token.controlHeight - 7}px;
    width: 0.5px;
  `
}));
