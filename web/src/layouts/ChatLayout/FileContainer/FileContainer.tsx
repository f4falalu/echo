'use client';

import React, { useMemo, useRef } from 'react';
import { FileContainerHeader } from './FileContainerHeader';
import { AppPageLayout, AppSplitter, AppSplitterRef } from '@/components/ui/layouts';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';
import { createAutoSaveId } from '@/components/ui/layouts/AppSplitter/helper';
import Cookies from 'js-cookie';
import { useMemoizedFn, useUpdateLayoutEffect } from '@/hooks';

interface FileContainerProps {
  children: React.ReactNode;
}

const defaultOpenLayout: [string, string] = ['auto', '310px'];
const defaulClosedLayout: [string, string] = ['auto', '0px'];
const autoSaveId = 'file-container-splitter';

export const FileContainer: React.FC<FileContainerProps> = ({ children }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);

  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const selectedFileViewRenderSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewRenderSecondary
  );
  const isOpenSecondary = selectedFileViewRenderSecondary;

  const secondaryLayoutDimensions: [string, string] = useMemo(() => {
    const cookieKey = createAutoSaveId(autoSaveId);
    const cookieValue = Cookies.get(cookieKey);
    if (cookieValue) {
      try {
        const parsedValue = JSON.parse(cookieValue) as string[];
        if (!parsedValue?.some((item) => item === 'auto')) {
          return parsedValue as [string, string];
        }
      } catch (error) {
        //
      }
    }
    return defaultOpenLayout as [string, string];
  }, []);

  const defaultLayout: [string, string] = useMemo(() => {
    if (isOpenSecondary) {
      return secondaryLayoutDimensions;
    }
    return defaulClosedLayout;
  }, []);

  const animateOpenSplitter = useMemoizedFn((side: 'open' | 'closed') => {
    if (side === 'open') {
      appSplitterRef.current?.animateWidth(defaultOpenLayout[1], 'right');
    } else {
      appSplitterRef.current?.animateWidth(defaulClosedLayout[1], 'right');
    }
  });

  useUpdateLayoutEffect(() => {
    animateOpenSplitter(isOpenSecondary ? 'open' : 'closed');
  }, [isOpenSecondary]);

  return (
    <AppPageLayout className="flex h-full min-w-[380px] flex-col" header={<FileContainerHeader />}>
      <AppSplitter
        ref={appSplitterRef}
        autoSaveId={autoSaveId}
        defaultLayout={defaultLayout}
        initialReady={false}
        leftChildren={children}
        rightChildren={<div>Right {selectedFileViewSecondary}</div>}
        allowResize={selectedFileViewRenderSecondary}
        preserveSide={'right'}
        rightPanelMinSize={250}
        rightPanelMaxSize={385}
      />
    </AppPageLayout>
  );
};

FileContainer.displayName = 'FileContainer';
