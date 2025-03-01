import React from 'react';
import { cn } from '@/lib/utils';
import { AppContentHeader } from './AppContentHeader';
import { AppContentPage } from './AppContentPage';

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
      {header && <AppContentHeader variant={headerVariant}>{header}</AppContentHeader>}
      <AppContentPage scrollable={scrollable}>{children}</AppContentPage>
    </div>
  );
};
