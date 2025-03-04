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
    headerSizeVariant?: 'default' | 'list';
    headerBorderVariant?: 'default' | 'ghost';
  }>
> = ({
  children,
  header,
  scrollable = false,
  className = '',
  headerSizeVariant = 'default',
  headerBorderVariant = 'default'
}) => {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden',
        scrollable && 'overflow-y-auto',
        className
      )}>
      {header && (
        <AppPageLayoutHeader sizeVariant={headerSizeVariant} borderVariant={headerBorderVariant}>
          {header}
        </AppPageLayoutHeader>
      )}
      <AppPageLayoutContent scrollable={scrollable}>{children}</AppPageLayoutContent>
    </div>
  );
};
