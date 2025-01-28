import { createStyles } from 'antd-style';
import React from 'react';

export const VerticalBar: React.FC<{ inProgress?: boolean; hasPills?: boolean }> = ({
  inProgress,
  hasPills
}) => {
  const { styles, cx } = useStyles();
  return (
    <div
      className={cx(
        'flex w-full flex-1 items-center justify-center overflow-hidden',
        // 'opacity-0',
        'transition-opacity duration-300',
        hasPills && 'opacity-100'
      )}>
      <div className={cx(styles.verticalBar, 'mt-1 overflow-hidden')} />
    </div>
  );
};

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    position: relative;
  `,
  verticalBar: css`
    width: 0.5px;
    height: 100%;
    background-color: ${token.colorTextPlaceholder};
  `
}));
