import React from 'react';
import { ChatHeaderOptions } from './ChatHeaderOptions';
import { ChatHeaderTitle } from './ChatHeaderTitle';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { cn } from '@/lib/classMerge';
import { AppPageLayoutHeader } from '@/components/ui/layouts/AppPageLayoutHeader';

export const ChatHeader: React.FC<{
  showScrollOverflow: boolean;
}> = React.memo(({ showScrollOverflow }) => {
  const hasFile = useChatIndividualContextSelector((state) => state.hasFile);
  const chatTitle = useChatIndividualContextSelector((state) => state.chatTitle);

  return (
    <AppPageLayoutHeader
      className={cn(
        'relative z-2 flex w-full items-center justify-between space-x-2 px-4 transition-shadow',
        showScrollOverflow && 'shadow-scroll-indicator'
      )}>
      {hasFile && chatTitle && (
        <>
          <ChatHeaderTitle />
          <ChatHeaderOptions />
        </>
      )}
    </AppPageLayoutHeader>
  );
});

ChatHeader.displayName = 'ChatContainerHeader';
