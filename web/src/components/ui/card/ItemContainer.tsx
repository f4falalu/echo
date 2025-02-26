import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    border-radius: ${token.borderRadius}px;
    border: 0.5px solid ${token.colorBorder};
  `,
  header: css`
    color: ${token.colorText};
    background: ${token.controlItemBgActive};
    border-bottom: 0.5px solid ${token.colorBorder};
    height: 36px;
  `,
  body: css`
    background: ${token.colorBgBase};
  `
}));

export const ItemContainer: React.FC<{
  children: React.ReactNode;
  title: string | React.ReactNode;
  bodyClass?: string;
  className?: string;
}> = ({ className = '', bodyClass = '', children, title }) => {
  const { styles, cx } = useStyles();

  return (
    <div className={cx(styles.container, className)}>
      <div className={cx(styles.header, 'flex items-center py-1 pr-3 pl-4')}>{title}</div>
      <div className={cx(styles.body, bodyClass || 'px-4 py-5')}>{children}</div>
    </div>
  );
};
