import { appContentHeaderHeight } from '@/components/layout/AppContentHeader';
import { createStyles } from 'antd-style';
import React from 'react';
import { SelectedFile } from '../../interfaces';
import { useChatSplitterContextSelector } from '../../ChatSplitterContext';
import { Text } from '@/components/text';
import { ChatContainerHeaderOptions } from './ChatContainerHeaderOptions';
import { ChatContainerHeaderTitle } from './ChatContainerHeaderTitle';

export const ChatContainerHeader: React.FC<{
  selectedFile: SelectedFile | undefined;
}> = React.memo(({ selectedFile }) => {
  const { cx, styles } = useStyles();
  const hasFile = useChatSplitterContextSelector((state) => state.hasFile);

  return (
    <div className={cx('flex w-full items-center justify-between space-x-2 px-4', styles.header)}>
      {hasFile && (
        <>
          <ChatContainerHeaderTitle />
          <ChatContainerHeaderOptions />
        </>
      )}
    </div>
  );
});

ChatContainerHeader.displayName = 'ChatContainerHeader';

const useStyles = createStyles(({ token }) => ({
  header: {
    height: appContentHeaderHeight
  }
}));
