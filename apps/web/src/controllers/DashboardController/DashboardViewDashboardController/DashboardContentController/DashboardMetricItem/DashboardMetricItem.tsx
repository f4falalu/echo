'use client';

import React, { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { useDashboardMetric } from './useDashboardMetric';
import { assetParamsToRoute } from '@/lib/assets';
import { MetricCard } from '@/components/ui/metric';
import { useContext } from 'use-context-selector';
import { SortableItemContext } from '@/components/ui/grid/SortableItemContext';
import { metricCardThreeDotMenuItems } from './metricCardThreeDotMenuItems';

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
  dashboardVersionNumber
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
    metricDataError
  } = useDashboardMetric({ metricId, versionNumber: metricVersionNumber });

  const loadingMetricData = !!metric && !isFetchedMetricData;
  const loading = loadingMetricData;
  const dataLength = metricData?.data?.length || 1;
  const animate =
    !initialAnimationEnded && !isDragOverlay && dataLength < 125 && numberOfMetrics <= 30;

  const error: string | undefined = useMemo(
    () => metric?.error || metricDataError?.message || metricError?.message || undefined,
    [metric?.error, metricDataError, metricError]
  );

  const metricLink = useMemo(() => {
    return assetParamsToRoute({
      type: 'metric',
      assetId: metricId,
      chatId,
      dashboardId,
      page: 'chart'
    });
  }, [metricId, chatId, dashboardId]);

  const threeDotMenuItems = useMemo(() => {
    return metricCardThreeDotMenuItems({ dashboardId, metricId });
  }, [dashboardId, metricId]);

  const onInitialAnimationEndPreflight = useMemoizedFn(() => {
    setInitialAnimationEnded(metricId);
  });

  const { attributes, listeners } = useContext(SortableItemContext);

  return (
    <MetricCard
      ref={containerRef}
      metricId={metricId}
      metric={metric}
      metricLink={metricLink}
      isDragOverlay={isDragOverlay}
      error={error}
      metricData={metricData}
      readOnly={readOnly}
      animate={animate}
      onInitialAnimationEnd={onInitialAnimationEndPreflight}
      renderChart={renderChart}
      loading={loading}
      className={className}
      attributes={attributes}
      listeners={listeners}
      threeDotMenuItems={threeDotMenuItems}
    />
  );
};

export const DashboardMetricItem = React.memo(DashboardMetricItemBase);
