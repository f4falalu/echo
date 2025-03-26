'use client';

import { useMemoizedFn } from '@/hooks';
import { type useSelectedFile } from './useSelectedFile';

export const useLayoutCollapse = ({
  onSetSelectedFile
}: {
  onSetSelectedFile: ReturnType<typeof useSelectedFile>['onSetSelectedFile'];
}) => {
  const onCollapseFileClick = useMemoizedFn((close?: boolean) => {
    onSetSelectedFile(null);
  });

  return onCollapseFileClick;
};
