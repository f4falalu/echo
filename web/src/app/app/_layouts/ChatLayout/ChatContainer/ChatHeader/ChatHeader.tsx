import { appContentHeaderHeight } from '@/components/layout/AppContentHeader';
import { createStyles } from 'antd-style';
import React from 'react';
import { ChatHeaderOptions } from './ChatHeaderOptions';
import { ChatHeaderTitle } from './ChatHeaderTitle';
import { useChatContextSelector } from '../../ChatContext';

export const ChatHeader: React.FC<{
  showScrollOverflow: boolean;
}> = React.memo(({ showScrollOverflow }) => {
  const { cx, styles } = useStyles();
  const hasFile = useChatContextSelector((state) => state.hasFile);
  const chatTitle = useChatContextSelector((state) => state.chatTitle);

  return (
    <div
      className={cx(
        'z-2 relative flex w-full items-center justify-between space-x-2 px-4',
        styles.header,
        showScrollOverflow && styles.scrollIndicator
      )}>
      {hasFile && chatTitle && (
        <>
          <ChatHeaderTitle />
          <ChatHeaderOptions />
        </>
      )}
    </div>
  );
});

ChatHeader.displayName = 'ChatContainerHeader';

const useStyles = createStyles(({ token }) => ({
  header: {
    height: appContentHeaderHeight,
    minHeight: appContentHeaderHeight,
    transition: 'box-shadow 0.2s ease-in-out'
  },
  scrollIndicator: {
    boxShadow: '0px 3px 5px 0 rgba(0, 0, 0, 0.08)'
  }
}));
