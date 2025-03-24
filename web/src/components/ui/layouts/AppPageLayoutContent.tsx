import React, { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../scroll-area/ScrollArea';

export const AppPageLayoutContent: React.FC<
  PropsWithChildren<{
    className?: string;
    scrollable?: boolean;
  }>
> = ({ className = '', children, scrollable = true }) => {
  const Selector = scrollable ? ScrollArea : 'main';
  const ChildSelector = scrollable ? 'main' : React.Fragment;

  return (
    <Selector className={cn('bg-page-background app-content h-full max-h-[100%] p-0', className)}>
      <ChildSelector>{children}</ChildSelector>
    </Selector>
  );
};
