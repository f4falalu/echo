import Cookies from 'js-cookie';
import type React from 'react';
import { useMemo } from 'react';
import {
  type AppSplitterRef,
  createAutoSaveId,
  type LayoutSize,
} from '@/components/ui/layouts/AppSplitter';
import { useUpdateLayoutEffect } from '@/hooks/useUpdateLayoutEffect';

const defaultSqlOpenLayout: LayoutSize = ['80%', 'auto'];

export const useMetricResultsLayout = ({
  appSplitterRef,
  autoSaveId,
}: {
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
  autoSaveId: string;
}) => {
  const defaultOpenLayout = defaultSqlOpenLayout;

  const defaultLayout: LayoutSize = useMemo(() => {
    const cookieKey = createAutoSaveId(autoSaveId);
    const cookieValue = Cookies.get(cookieKey);
    if (cookieValue) {
      try {
        const parsedValue = JSON.parse(cookieValue) as string[];
        if (!parsedValue?.some((item) => item === 'auto')) {
          return parsedValue as LayoutSize;
        }
      } catch (error) {
        //
      }
    }
    return defaultOpenLayout;
  }, []);

  const animateOpenSplitter = (side: 'metric' | 'both') => {
    if (!appSplitterRef.current) return;

    if (side === 'metric') {
      appSplitterRef.current.animateWidth('0px', 'left');
    } else if (side === 'both') {
      appSplitterRef.current.animateWidth('40%', 'left');
    }
  };

  useUpdateLayoutEffect(() => {
    animateOpenSplitter('both');
  }, []);

  return {
    defaultLayout,
  };
};
