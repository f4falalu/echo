'use client';

import { useMemoizedFn } from '@/hooks';
import { useEffect, useMemo, useState } from 'react';
import { SelectedFileParams } from './useSelectedFileAndLayout';
import { ChatLayoutView } from '../interfaces';

export const useLayoutCollapse = ({
  animateOpenSplitter
}: {
  animateOpenSplitter: (side: 'left' | 'right' | 'both') => void;
}) => {
  const onCollapseFileClick = useMemoizedFn((close?: boolean) => {
    // if (selectedFile && selectedFile.type === 'reasoning') {
    //   animateOpenSplitter(!isCloseAction ? 'both' : 'left');
    // } else if (isFileLayout) {
    //   // For file layout, toggle between 'both' and 'right'
    //   animateOpenSplitter(!isCloseAction && selectedFile ? 'both' : 'right');
    // } else {
    //   // For other layouts, toggle between 'right' and 'both'
    //   animateOpenSplitter(isCloseAction ? 'left' : 'both');
    // }

    animateOpenSplitter('left');
  });

  return {
    onCollapseFileClick
  };
};
