import type { DataMetadata } from '@buster/server-shared/metrics';
import type React from 'react';
import type { BusterMetric, BusterMetricData } from '@/api/asset_interfaces/metric';
import { BusterChartDynamic } from '@/components/ui/charts/BusterChartDynamic';
import { PreparingYourRequestLoader } from '@/components/ui/charts/LoadingComponents';
import { cn } from '@/lib/classMerge';
import { METRIC_CHART_CONTAINER_ID } from './config';

type MetricViewChartContentProps = {
  className?: string;
  errorMessage: string | null | undefined;
  metricId: string;
  readOnly: boolean;
  chartConfig: Required<BusterMetric['chart_config']> | undefined;
  metricData: BusterMetricData['data'];
  dataMetadata: DataMetadata | undefined;
  fetchedData: boolean;
  fetchedMetric: boolean;
  animate: boolean;
};

export const MetricViewChartContent: React.FC<MetricViewChartContentProps> = ({
  className,
  chartConfig,
  metricData = null,
  dataMetadata,
  fetchedData,
  errorMessage,
  metricId,
  readOnly,
  fetchedMetric,
  animate = true,
}) => {
  const columnMetadata = dataMetadata?.column_metadata;
  const isTable = chartConfig?.selectedChartType === 'table';

  // Determine the card class name based on chart type and data fetch status
  const cardClassName = isTable || !fetchedData ? '' : 'p-4';

  return (
    <div
      className={cn('flex h-full flex-col overflow-hidden', cardClassName, className)}
      data-testid="metric-view-chart-content"
    >
      {fetchedMetric && chartConfig ? (
        <BusterChartDynamic
          loading={!fetchedData}
          error={errorMessage || undefined}
          data={metricData}
          columnMetadata={columnMetadata}
          id={METRIC_CHART_CONTAINER_ID(metricId)}
          readOnly={readOnly}
          animate={animate}
          animateLegend={animate}
          {...chartConfig}
        />
      ) : (
        <PreparingYourRequestLoader text="Processing your request..." />
      )}
    </div>
  );
};

MetricViewChartContent.displayName = 'MetricViewChartContent';
