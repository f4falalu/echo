import React, { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

export const AppPageLayoutContent: React.FC<
  PropsWithChildren<{
    className?: string;
    scrollable?: boolean;
  }>
> = ({ className = '', children, scrollable = true }) => {
  return (
    <main
      className={cn(
        'app-content-page',
        'bg-page-background app-content h-full max-h-[100%] overflow-hidden p-0',
        scrollable && 'overflow-y-auto',
        className
      )}>
      {children}
    </main>
  );
};
