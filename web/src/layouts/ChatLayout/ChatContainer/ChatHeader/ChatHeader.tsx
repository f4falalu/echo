import { appContentHeaderHeight } from '@/components/ui/layouts/AppContentHeader';
import { createStyles } from 'antd-style';
import React from 'react';
import { ChatHeaderOptions } from './ChatHeaderOptions';
import { ChatHeaderTitle } from './ChatHeaderTitle';
import { useChatIndividualContextSelector } from '../../ChatContext';

export const ChatHeader: React.FC<{
  showScrollOverflow: boolean;
}> = React.memo(({ showScrollOverflow }) => {
  const { cx, styles } = useStyles();
  const hasFile = useChatIndividualContextSelector((state) => state.hasFile);
  const chatTitle = useChatIndividualContextSelector((state) => state.chatTitle);

  return (
    <div
      className={cx(
        'relative z-2 flex w-full items-center justify-between space-x-2 px-4',
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
