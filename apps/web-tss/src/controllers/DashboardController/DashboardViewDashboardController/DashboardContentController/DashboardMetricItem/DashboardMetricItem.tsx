'use client';

import type React from 'react';
import { useContext, useMemo } from 'react';
import { SortableItemContext } from '@/components/ui/grid/SortableItemContext';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMetricCardThreeDotMenuItems } from './metricCardThreeDotMenuItems';
import { useDashboardMetric } from './useDashboardMetric';

const DashboardMetricItemBase: React.FC<{
  metricId: string;
  metricVersionNumber: number | undefined;
  dashboardVersionNumber: number | undefined;
  chatId: string | undefined;
  dashboardId: string;
  numberOfMetrics: number;
  className?: string;
  isDragOverlay?: boolean;
  readOnly?: boolean;
}> = ({
  readOnly = false,
  dashboardId,
  metricVersionNumber,
  className = '',
  metricId,
  isDragOverlay = false,
  numberOfMetrics,
  chatId,
  dashboardVersionNumber,
}) => {
  const {
    containerRef,
    renderChart,
    metric,
    metricData,
    initialAnimationEnded,
    setInitialAnimationEnded,
    isFetchedMetricData,
    metricError,
    metricDataError,
  } = useDashboardMetric({ metricId, versionNumber: metricVersionNumber });

  const loadingMetricData = !!metric && !isFetchedMetricData;
  const loading = loadingMetricData;
  const dataLength = metricData?.data?.length || 1;
  const animate =
    !initialAnimationEnded && !isDragOverlay && dataLength < 125 && numberOfMetrics <= 30;

  const error: string | undefined =
    metric?.error || metricDataError?.message || metricError?.message || undefined;

  // const metricLink = useMemo(() => {
  //   return assetParamsToRoute({
  //     type: 'metric',
  //     assetId: metricId,
  //     chatId,
  //     dashboardId,
  //     page: 'chart',
  //   });
  // }, [metricId, chatId, dashboardId]);

  const threeDotMenuItems = useMetricCardThreeDotMenuItems({
    dashboardId,
    metricId,
    metricVersionNumber,
  });

  const onInitialAnimationEndPreflight = useMemoizedFn(() => {
    setInitialAnimationEnded(metricId);
  });

  const { attributes, listeners } = useContext(SortableItemContext);

  return <div>TODO</div>;
  // <MetricCard
  //   ref={containerRef}
  //   metricId={metricId}
  //   metric={metric}
  //   metricLink={metricLink}
  //   isDragOverlay={isDragOverlay}
  //   error={error}
  //   metricData={metricData}
  //   readOnly={readOnly}
  //   animate={animate}
  //   onInitialAnimationEnd={onInitialAnimationEndPreflight}
  //   renderChart={renderChart}
  //   loading={loading}
  //   className={className}
  //   attributes={attributes}
  //   listeners={listeners}
  //   threeDotMenuItems={threeDotMenuItems}
  // />
};

export const DashboardMetricItem = DashboardMetricItemBase;
