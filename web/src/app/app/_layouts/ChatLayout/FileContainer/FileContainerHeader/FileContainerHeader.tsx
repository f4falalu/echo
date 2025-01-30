import { appContentHeaderHeight } from '@/components/layout';
import { createStyles } from 'antd-style';
import React from 'react';
import { CollapseFileButton } from './CollapseFileButton';

export const FileContainerHeader: React.FC = React.memo(() => {
  const { styles, cx } = useStyles();

  const showCollapseButton = true;
  const isCollapseOpen = true; //I could get the defaultSelectedLayout from the context and check if it is 'both'?

  return (
    <div className={cx(styles.container, 'flex w-full items-center px-3')}>
      <CollapseFileButton showCollapseButton={showCollapseButton} isOpen={isCollapseOpen} />
    </div>
  );
});

FileContainerHeader.displayName = 'FileContainerHeader';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    min-height: ${appContentHeaderHeight}px;
    height: ${appContentHeaderHeight}px;
    border-bottom: 0.5px solid ${token.colorBorder};
  `
}));
