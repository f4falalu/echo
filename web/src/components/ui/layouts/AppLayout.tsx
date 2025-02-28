'use server';

import React from 'react';
import { AppContentPage } from './AppContentPage';
import { AppContentHeader } from './AppContentHeader';
import { cn } from '@/lib/utils';
import { AppSplitter } from './AppSplitter/AppSplitter';

const DEFAULT_LAYOUT = ['230px', 'auto'];

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
    <PageLayout header={header} floating={floating} scrollable={scrollable} className={className}>
      {children}
    </PageLayout>
  );

  if (!sidebar) {
    return <>{PageContent}</>;
  }

  return (
    <AppSplitter
      defaultLayout={defaultLayout ?? DEFAULT_LAYOUT}
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

const PageLayout: React.FC<
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
        {header && <AppContentHeader>{header}</AppContentHeader>}
        <AppContentPage scrollable={scrollable}>{children}</AppContentPage>
      </div>
    </div>
  );
};
