import { type useAutoScroll } from '@/hooks/useAutoScroll';
import React from 'react';
import { ChevronDown } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { AppTooltip } from '@/components/ui/tooltip';

export const ChatScrollToBottom: React.FC<{
  isAutoScrollEnabled: boolean;
  scrollToBottom: ReturnType<typeof useAutoScroll>['scrollToBottom'];
}> = React.memo(({ isAutoScrollEnabled, scrollToBottom }) => {
  return (
    <AppTooltip title="Stick to bottom">
      <button
        onClick={scrollToBottom}
        className={cn(
          'bg-background/90 hover:bg-item-hover/90 absolute -top-9 right-3 z-10 rounded-full border p-2 shadow transition-all duration-300 hover:scale-105 hover:shadow-md',
          isAutoScrollEnabled
            ? 'pointer-events-none scale-90 opacity-0'
            : 'pointer-events-auto scale-100 cursor-pointer opacity-100'
        )}>
        <ChevronDown />
      </button>
    </AppTooltip>
  );
});

ChatScrollToBottom.displayName = 'ChatScrollToBottom';
