import React from 'react';

import { AppContent } from './AppContent';
import { AppHeader } from './AppHeader';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC<
  React.PropsWithChildren<{
    header?: React.ReactNode;
    floating?: boolean;
    scrollable?: boolean;
    className?: string;
  }>
> = ({ children, header, floating = true, scrollable = true, className = '' }) => {
  return (
    <div className={cn('h-screen w-full overflow-hidden', floating && 'p-2', className)}>
      <div
        className={cn(
          'bg-background flex h-full w-full flex-col',
          floating && 'overflow-hidden rounded border'
        )}>
        {header && <AppHeader>{header}</AppHeader>}
        <AppContent scrollable={scrollable}>{children}</AppContent>
      </div>
    </div>
  );
};
