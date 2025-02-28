import React from 'react';
import { AppContentPage } from './AppContentPage';
import { AppContentHeader } from './AppContentHeader';
import { cn } from '@/lib/utils';
import { AppSplitter } from './AppSplitter/AppSplitter';

const DEFAULT_LAYOUT = ['230px', 'auto'];

/**
 * @param header - Optional header content at the top of the layout
 * @param floating - Applies floating styles with padding and border (default: true)
 * @param scrollable - Makes content scrollable (default: true)
 * @param className - Additional CSS classes
 * @param sidebar - Optional sidebar content on the left side
 * @param defaultLayout - Custom layout dimensions [leftWidth, rightWidth]
 * @param leftHidden - Whether the left sidebar is hidden
 * @param children - Main content of the layout
 */
export const AppLayout: React.FC<
  React.PropsWithChildren<{
    header?: React.ReactNode;
    floating?: boolean;
    scrollable?: boolean;
    className?: string;
    sidebar?: React.ReactNode;
    defaultLayout?: [string, string];
    leftHidden?: boolean;
  }>
> = ({
  children,
  defaultLayout,
  header,
  floating = true,
  scrollable = true,
  className = '',
  sidebar
}) => {
  const PageContent = (
    <PageLayout
      hasSidebar={!!sidebar}
      header={header}
      floating={floating}
      scrollable={scrollable}
      className={className}>
      {children}
    </PageLayout>
  );

  if (!sidebar) {
    return <>{PageContent}</>;
  }

  return (
    <AppSplitter
      defaultLayout={defaultLayout ?? DEFAULT_LAYOUT}
      className="min-h-screen overflow-hidden"
      autoSaveId="app-layout"
      preserveSide="left"
      splitterClassName={''}
      leftPanelMinSize={'190px'}
      leftPanelMaxSize={'300px'}
      hideSplitter={true}
      leftChildren={sidebar}
      rightChildren={PageContent}
    />
  );
};

/**
 * @param header - Header content at the top of the page
 * @param floating - Applies floating styles (default: true)
 * @param scrollable - Makes content scrollable (default: true)
 * @param className - Additional CSS classes
 * @param children - Page content
 * @internal
 */
const PageLayout: React.FC<
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
  scrollable = false,
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
        <AppContentPage>{children}</AppContentPage>
      </div>
    </div>
  );
};
