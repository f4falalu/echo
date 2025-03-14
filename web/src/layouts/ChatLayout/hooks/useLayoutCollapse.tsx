'use client';

import { useMemoizedFn } from '@/hooks';
import { useSelectedFileAndLayout } from './useSelectedFileAndLayout';

export const useLayoutCollapse = ({
  onSetSelectedFile
}: {
  onSetSelectedFile: ReturnType<typeof useSelectedFileAndLayout>['onSetSelectedFile'];
}) => {
  const onCollapseFileClick = useMemoizedFn((close?: boolean) => {
    onSetSelectedFile(null);
  });

  return onCollapseFileClick;
};
