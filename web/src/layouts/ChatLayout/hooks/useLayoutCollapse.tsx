'use client';

import { useMemoizedFn } from '@/hooks';
import { useEffect, useMemo, useState } from 'react';
import { SelectedFileParams } from './useSelectedFileAndLayout';
import { ChatLayoutView } from '../interfaces';

export const useLayoutCollapse = ({
  selectedFile,
  animateOpenSplitter,
  selectedLayout
}: {
  selectedFile: SelectedFileParams['selectedFile'];
  selectedLayout: ChatLayoutView;
  animateOpenSplitter: (side: 'left' | 'right' | 'both') => void;
}) => {
  const isReasoningFile = selectedFile?.type === 'reasoning';

  const [isCollapseOpen, setIsCollapseOpen] = useState(isReasoningFile ? true : false);

  const collapseDirection: 'left' | 'right' = useMemo(() => {
    if (selectedFile?.type === 'reasoning') return 'right';

    return selectedLayout === 'file' ? 'left' : 'right';
  }, [selectedLayout, selectedFile?.type]);

  const onCollapseFileClick = useMemoizedFn((close?: boolean) => {
    const isCloseAction = close ?? isCollapseOpen;
    const isFileLayout = selectedLayout === 'file';

    setIsCollapseOpen(!isCloseAction);

    if (selectedFile && selectedFile.type === 'reasoning') {
      animateOpenSplitter(!isCloseAction ? 'both' : 'left');
    } else if (isFileLayout) {
      // For file layout, toggle between 'both' and 'right'
      animateOpenSplitter(!isCloseAction && selectedFile ? 'both' : 'right');
    } else {
      // For other layouts, toggle between 'right' and 'both'
      animateOpenSplitter(isCloseAction ? 'left' : 'both');
    }
  });

  useEffect(() => {
    if (isReasoningFile && !isCollapseOpen) {
      setIsCollapseOpen(true);
    }
  }, [isReasoningFile]);

  return {
    collapseDirection,
    isCollapseOpen,
    onCollapseFileClick
  };
};
