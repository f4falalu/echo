'use client';

import { useMemo } from 'react';
import type { SelectedFile } from '../../interfaces';
import { useMemoizedFn } from '@/hooks';
import { createSelectedFile } from './createSelectedFile';
import type { useGetChatParams } from '../useGetChatParams';
import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';

export const useSelectedFile = ({
  animateOpenSplitter,
  appSplitterRef,
  chatParams
}: {
  animateOpenSplitter: (side: 'left' | 'right' | 'both') => void;
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
  chatParams: ReturnType<typeof useGetChatParams>;
}) => {
  const { metricVersionNumber, dashboardVersionNumber } = chatParams;

  const selectedFile: SelectedFile | null = useMemo(() => {
    return createSelectedFile(chatParams);
  }, [chatParams]);

  const isVersionHistoryMode = useMemo(() => {
    if (selectedFile?.type === 'metric') return !!metricVersionNumber;
    if (selectedFile?.type === 'dashboard') return !!dashboardVersionNumber;
    return false;
  }, [selectedFile?.type, metricVersionNumber, dashboardVersionNumber]);

  /**
   * @description Opens the splitter if the file is not already open. If the file is already open, it will collapse the splitter. This does NOT set the selected file. You should do that with a Link
   * @param file
   */
  const onSetSelectedFile = useMemoizedFn(async (file: SelectedFile | null) => {
    const handleFileCollapse =
      !file || (file?.id === selectedFile?.id && !appSplitterRef.current?.isSideClosed('right'));

    if (handleFileCollapse) {
      animateOpenSplitter('left');
      return;
    }

    animateOpenSplitter('both');
  });

  const onCollapseFileClick = useMemoizedFn((close?: boolean) => {
    onSetSelectedFile(null);
  });

  return useMemo(
    () => ({
      isVersionHistoryMode,
      onSetSelectedFile,
      selectedFile,
      onCollapseFileClick
    }),
    [onSetSelectedFile, isVersionHistoryMode, selectedFile]
  );
};

export type SelectedFileParams = ReturnType<typeof useSelectedFile>;
