import React, { useState } from 'react';
import { useMemoizedFn, useUpdateLayoutEffect } from 'ahooks';
import { type AppSplitterRef } from '@/components/layout';

export const useMetricControllerLayout = ({
  selectedFileViewSecondary,
  appSplitterRef
}: {
  selectedFileViewSecondary: null | string;
  appSplitterRef: React.RefObject<AppSplitterRef>;
}) => {
  const [renderSecondary, setRenderSecondary] = useState<boolean>(false);

  const isOpenSecondary = !!selectedFileViewSecondary;

  const animateOpenSplitter = useMemoizedFn((side: 'metric' | 'both') => {
    if (appSplitterRef.current) {
      if (side === 'metric') {
        appSplitterRef.current.animateWidth('100%', 'left');
      } else if (side === 'both') {
        appSplitterRef.current.animateWidth('310px', 'right');
      }
    }
  });

  useUpdateLayoutEffect(() => {
    if (!renderSecondary) setRenderSecondary(isOpenSecondary);
    animateOpenSplitter(isOpenSecondary ? 'both' : 'metric');
  }, [isOpenSecondary]);

  return {
    renderSecondary
  };
};
