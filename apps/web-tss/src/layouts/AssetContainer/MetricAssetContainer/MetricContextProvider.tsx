import { type ParsedLocation, useLocation, useNavigate } from '@tanstack/react-router';
import { useCallback, useRef } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

const useMetricAssetContext = () => {
  const splitterRef = useRef<AppSplitterRef>(null);
  const pathname = useLocation({ select: useCallback((x: ParsedLocation) => x.pathname, []) });
  const isMetricEditMode = pathname.includes('/chart/edit');
  const { metricId } = useGetMetricParams();
  const navigate = useNavigate();

  const toggleEditMode = useMemoizedFn(async (v?: boolean) => {
    const toggleOff = v !== undefined ? v : !isMetricEditMode;

    if (!splitterRef.current) {
      console.warn('splitterRef is not set');
      return;
    }

    if (!toggleOff) {
      await splitterRef.current?.animateWidth('0px', 'right', 300);
      await navigate({
        to: '/app/metrics/$metricId/chart',
        params: { metricId },
      });
    } else {
      splitterRef.current?.animateWidth('300px', 'right', 300);
      await navigate({
        to: '/app/metrics/$metricId/chart/edit',
        mask: {
          to: '/app/metrics/$metricId/chart/edit',
          params: { metricId },
          unmaskOnReload: true,
        },
        params: { metricId },
      });
    }
  });

  return {
    toggleEditMode,
    splitterRef,
    isMetricEditMode,
  };
};

const MetricAssetContext = createContext<ReturnType<typeof useMetricAssetContext>>(
  {} as ReturnType<typeof useMetricAssetContext>
);

export const MetricAssetContextProvider = ({
  children,
}: {
  children:
    | React.ReactNode
    | ((context: ReturnType<typeof useMetricAssetContext>) => React.ReactNode);
}) => {
  const context = useMetricAssetContext();

  return (
    <MetricAssetContext.Provider value={context}>
      {typeof children === 'function' ? children(context) : children}
    </MetricAssetContext.Provider>
  );
};

const stableIsMetricEditMode = (x: ReturnType<typeof useMetricAssetContext>) => x.isMetricEditMode;
export const useIsMetricEditMode = () => {
  return useContextSelector(MetricAssetContext, stableIsMetricEditMode);
};

const stableMetricEditSplitter = (x: ReturnType<typeof useMetricAssetContext>) => x.splitterRef;
export const useMetricEditSplitter = () => {
  return useContextSelector(MetricAssetContext, stableMetricEditSplitter);
};

const stableToggleEditMode = (x: ReturnType<typeof useMetricAssetContext>) => x.toggleEditMode;
export const useMetricEditToggle = () => {
  return useContextSelector(MetricAssetContext, stableToggleEditMode);
};
