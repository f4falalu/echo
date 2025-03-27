import React, { useMemo, useState } from 'react';
import { useMemoizedFn, useUpdateLayoutEffect } from '@/hooks';
import { type AppSplitterRef } from '@/components/ui/layouts';
import Cookies from 'js-cookie';
import { createAutoSaveId } from '@/components/ui/layouts/AppSplitter/helper';

const defaultSqlOpenLayout = ['30%', 'auto'];
const defaultSqlLayout = ['0px', 'auto'];

export const useMetricResultsLayout = ({
  selectedFileViewSecondary,
  appSplitterRef,
  autoSaveId
}: {
  selectedFileViewSecondary: null | string;
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
  autoSaveId: string;
}) => {
  const [renderSecondary, setRenderSecondary] = useState<boolean>(!!selectedFileViewSecondary);

  const isOpenSecondary = !!selectedFileViewSecondary;
  const defaultOpenLayout = defaultSqlOpenLayout;
  const defaultOriginalLayout = defaultSqlLayout;

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
    return defaultOriginalLayout as [string, string];
  }, []);

  const animateOpenSplitter = useMemoizedFn((side: 'metric' | 'both') => {
    if (!appSplitterRef.current) return;

    if (side === 'metric') {
      appSplitterRef.current.animateWidth('0px', 'left');
    } else if (side === 'both') {
      appSplitterRef.current.animateWidth('40%', 'left');
    }
  });

  useUpdateLayoutEffect(() => {
    if (!renderSecondary) setRenderSecondary(isOpenSecondary);
    animateOpenSplitter(isOpenSecondary ? 'both' : 'metric');
  }, [isOpenSecondary]);

  return {
    renderSecondary,
    defaultLayout
  };
};
