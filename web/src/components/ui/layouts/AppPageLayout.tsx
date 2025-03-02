import React from 'react';
import { cn } from '@/lib/utils';
import { AppPageLayoutHeader } from './AppPageLayoutHeader';
import { AppPageLayoutContent } from './AppPageLayoutContent';

/**
 * @param header - Header content at the top of the page
 * @param floating - Applies floating styles (default: true)
 * @param scrollable - Makes content scrollable (default: true)
 * @param className - Additional CSS classes
 * @param children - Page content
 * @internal
 */
export const AppPageLayout: React.FC<
  React.PropsWithChildren<{
    header?: React.ReactNode;
    scrollable?: boolean;
    className?: string;
    headerVariant?: 'default' | 'list';
  }>
> = ({ children, header, scrollable = false, className = '', headerVariant = 'default' }) => {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden',
        scrollable && 'overflow-y-auto',
        className
      )}>
      {header && <AppPageLayoutHeader variant={headerVariant}>{header}</AppPageLayoutHeader>}
      <AppPageLayoutContent scrollable={scrollable}>{children}</AppPageLayoutContent>
    </div>
  );
};
