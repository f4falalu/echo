import React, { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

export const AppContentPage: React.FC<
  PropsWithChildren<{
    className?: string;
    scrollable?: boolean;
  }>
> = ({ className = '', children, scrollable = true }) => {
  return (
    <main
      className={cn(
        'bg-background app-content max-h-[100%] overflow-hidden p-0',
        scrollable && 'overflow-y-auto',
        className
      )}>
      {children}
    </main>
  );
};
