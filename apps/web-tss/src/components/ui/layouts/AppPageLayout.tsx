import type React from 'react';
import { cn } from '@/lib/utils';
import { AppPageLayoutContent } from './AppPageLayoutContent';
import { AppPageLayoutHeader } from './AppPageLayoutHeader';

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
    secondaryHeader?: React.ReactNode;
    scrollable?: boolean;
    className?: string;
    headerSizeVariant?: 'default' | 'list';
    headerBorderVariant?: 'default' | 'ghost';
    headerClassName?: string;
    mainClassName?: string;
    contentContainerId?: string;
    id?: string;
  }>
> = ({
  children,
  header,
  id,
  secondaryHeader,
  scrollable = false,
  className = '',
  headerSizeVariant = 'default',
  headerBorderVariant = 'default',
  headerClassName = '',
  mainClassName = '',
  contentContainerId,
}) => {
  return (
    <div
      id={id}
      className={cn(
        'app-page-layout flex h-full w-full flex-col overflow-hidden',
        scrollable && 'overflow-y-auto',
        className
      )}
    >
      {header && (
        <AppPageLayoutHeader
          className={cn(headerBorderVariant === 'ghost' && '-mt-[0.5px]', headerClassName)}
          sizeVariant={headerSizeVariant}
        >
          {header}
        </AppPageLayoutHeader>
      )}

      {secondaryHeader && (
        <AppPageLayoutHeader
          className={cn(headerBorderVariant === 'ghost' && '-mt-[0.5px]', headerClassName)}
          sizeVariant={headerSizeVariant}
        >
          {secondaryHeader}
        </AppPageLayoutHeader>
      )}

      <AppPageLayoutContent
        className={cn(headerBorderVariant === 'ghost' && 'scroll-shadow-container', mainClassName)}
        scrollable={scrollable}
        id={contentContainerId}
      >
        <div
          className={cn(
            'pointer-events-none top-[0px] z-10 right-0 left-0 h-[0.5px] w-full sticky bg-border',
            headerBorderVariant === 'ghost' && 'scroll-header'
          )}
        />

        {children}
      </AppPageLayoutContent>
    </div>
  );
};
