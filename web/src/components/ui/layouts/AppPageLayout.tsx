import { cn } from '@/lib/utils';
import React from 'react';
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
export const PageLayout: React.FC<
  React.PropsWithChildren<{
    header?: React.ReactNode;
    floating?: boolean;
    scrollable?: boolean;
    className?: string;
    hasSidebar?: boolean;
  }>
> = ({
  children,
  header,
  floating = true,
  scrollable = true,
  className = '',
  hasSidebar = false
}) => {
  return (
    <div
      className={cn(
        'h-screen w-full overflow-hidden',
        floating && 'py-2 pr-2',
        !hasSidebar && 'pl-2',
        className
      )}>
      <div
        className={cn(
          'bg-background flex h-full w-full flex-col',
          floating && 'overflow-hidden rounded border'
        )}>
        {header && <AppContentHeader>{header}</AppContentHeader>}
        <AppContentPage scrollable={scrollable}>{children}</AppContentPage>
      </div>
    </div>
  );
};
