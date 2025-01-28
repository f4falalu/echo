import { appContentHeaderHeight } from '@/components/layout';
import { createStyles } from 'antd-style';
import React from 'react';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { CollapseFileButton } from './CollapseFileButton';

export const FileContainerHeader: React.FC = React.memo(() => {
  const { styles, cx } = useStyles();
  const selectedLayout = useChatLayoutContextSelector((state) => state.selectedLayout);

  const showCollapseButton = true;
  const isCollapseOpen = selectedLayout === 'both';

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
