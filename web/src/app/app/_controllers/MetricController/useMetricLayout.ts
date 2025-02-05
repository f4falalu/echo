import React, { useMemo, useState } from 'react';
import { useMemoizedFn, useUpdateLayoutEffect } from 'ahooks';
import { type AppSplitterRef } from '@/components/layout';
import Cookies from 'js-cookie';
import { createAutoSaveId } from '@/components/layout/AppSplitter/helper';

const defaultChartOpenLayout = ['auto', '310px'];
const defaultSqlOpenLayout = ['30%', 'auto'];

const defaultChartLayout = ['auto', '0px'];
const defaultSqlLayout = ['0px', 'auto'];

export const useMetricLayout = ({
  selectedFileViewSecondary,
  appSplitterRef,
  autoSaveId,
  type
}: {
  selectedFileViewSecondary: null | string;
  appSplitterRef: React.RefObject<AppSplitterRef>;
  autoSaveId: string;
  type: 'chart' | 'sql';
}) => {
  const [renderSecondary, setRenderSecondary] = useState<boolean>(!!selectedFileViewSecondary);

  const isOpenSecondary = !!selectedFileViewSecondary;
  const isChart = type === 'chart';
  const defaultOpenLayout = isChart ? defaultChartOpenLayout : defaultSqlOpenLayout;
  const defaultOriginalLayout = isChart ? defaultChartLayout : defaultSqlLayout;

  const secondaryLayoutDimensions = useMemo(() => {
    const cookieKey = createAutoSaveId(autoSaveId);
    const cookieValue = Cookies.get(cookieKey);
    if (cookieValue) {
      try {
        const parsedValue = JSON.parse(cookieValue);
        return parsedValue;
      } catch (error) {
        //
      }
    }
    return defaultOpenLayout;
  }, []);

  const defaultLayout = useMemo(() => {
    if (isOpenSecondary) {
      return secondaryLayoutDimensions;
    }
    return defaultOriginalLayout;
  }, []);

  const animateOpenSplitter = useMemoizedFn((side: 'metric' | 'both') => {
    if (!appSplitterRef.current) return;

    if (type === 'chart') {
      if (side === 'metric') {
        appSplitterRef.current.animateWidth('100%', 'left');
      } else if (side === 'both') {
        appSplitterRef.current.animateWidth('310px', 'right');
      }
    }

    if (type === 'sql') {
      if (side === 'metric') {
        appSplitterRef.current.animateWidth('0px', 'left');
      } else if (side === 'both') {
        appSplitterRef.current.animateWidth('40%', 'left');
      }
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
