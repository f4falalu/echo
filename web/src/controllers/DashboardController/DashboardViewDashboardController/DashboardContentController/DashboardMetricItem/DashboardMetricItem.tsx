import React, { useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/card/CardBase';
import { useDashboardMetric } from './useDashboardMetric';
import { MetricTitle } from './MetricTitle';
import { createBusterRoute, BusterRoutes } from '@/routes';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { BusterChart } from '@/components/ui/charts/BusterChart';

const DashboardMetricItemBase: React.FC<{
  metricId: string;
  dashboardId: string;
  numberOfMetrics: number;
  className?: string;
  isDragOverlay?: boolean;
  readOnly?: boolean;
}> = ({
  readOnly,
  dashboardId,
  className = '',
  metricId,
  isDragOverlay = false,
  numberOfMetrics
}) => {
  const {
    conatinerRef,
    renderChart,
    metric,
    metricData,
    initialAnimationEnded,
    setInitialAnimationEnded,
    isFetchedMetricData,
    isMetricFetched
  } = useDashboardMetric({ metricId });

  const loadingMetricData = !!metric && !isFetchedMetricData;
  const chartOptions = metric.chart_config;
  const data = metricData?.data || null;
  const loading = loadingMetricData;
  const dataLength = metricData?.data?.length || 1;
  const animate =
    !initialAnimationEnded && !isDragOverlay && dataLength < 125 && numberOfMetrics <= 30;
  const isTable = metric.chart_config.selectedChartType === 'table';

  const error = useMemo(() => {
    if (metric.error) {
      return metric.error;
    }
    if (metric.code === null && isMetricFetched) {
      return 'No code was generated for this request';
    }
    return undefined;
  }, [metric.error, metric.code]);

  const metricLink = useMemo(() => {
    return createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_METRICS_ID,
      metricId: metricId,
      dashboardId: dashboardId
    });
  }, [metricId, dashboardId]);

  const onInitialAnimationEndPreflight = useMemoizedFn(() => {
    setInitialAnimationEnded(metricId);
  });

  // const cardClassNamesMemoized = useMemo(() => {
  //   return {
  //     body: `h-full w-full overflow-hidden ${isTable ? 'p-0!' : 'px-2! pt-2! pb-0.5!'} relative`,
  //     header: cx(`p-0! min-h-[52px]! mb-0!`, styles.cardTitle)
  //   };
  // }, [isTable]);

  return (
    <Card
      ref={conatinerRef}
      className={`metric-item flex h-full w-full flex-col overflow-auto ${className}`}>
      <CardHeader size="small" className="hover:bg-item-hover border-b">
        <MetricTitle
          title={metric.title}
          timeFrame={metric.time_frame}
          metricLink={metricLink}
          isDragOverlay={isDragOverlay}
          metricId={metricId}
          dashboardId={dashboardId}
          readOnly={readOnly}
          description={metric.description}
        />
      </CardHeader>

      <div
        className={cn(
          //  'absolute bottom-0 left-0 right-0 top-[1px]',
          `h-full w-full overflow-hidden bg-transparent`,
          isDragOverlay ? 'pointer-events-none' : 'pointer-events-auto'
        )}>
        {renderChart && (
          <BusterChart
            data={data}
            loading={loading}
            error={error}
            onInitialAnimationEnd={onInitialAnimationEndPreflight}
            animate={!isDragOverlay && animate}
            animateLegend={false}
            columnMetadata={metricData?.data_metadata?.column_metadata}
            readOnly={true}
            {...chartOptions}
          />
        )}
      </div>
    </Card>
  );
};

export const DashboardMetricItem = React.memo(DashboardMetricItemBase, (prev, next) => {
  return prev.metricId === next.metricId && prev.dashboardId === next.dashboardId;
});
