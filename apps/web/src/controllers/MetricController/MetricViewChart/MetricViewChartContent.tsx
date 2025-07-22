import React, { useMemo } from 'react';
import type { BusterMetricData, BusterMetric } from '@/api/asset_interfaces/metric';
import type { DataMetadata } from '@buster/server-shared/metrics';
import { BusterChartDynamic } from '@/components/ui/charts';
import { cn } from '@/lib/classMerge';
import { METRIC_CHART_CONTAINER_ID } from './config';

interface MetricViewChartContentProps {
  className?: string;
  chartConfig: Required<BusterMetric['chart_config']>;
  metricData: BusterMetricData['data'];
  dataMetadata: DataMetadata | undefined;
  fetchedData: boolean;
  errorMessage: string | null | undefined;
  metricId: string;
  readOnly: boolean;
}

export const MetricViewChartContent: React.FC<MetricViewChartContentProps> = ({
  className,
  chartConfig,
  metricData = null,
  dataMetadata,
  fetchedData,
  errorMessage,
  metricId,
  readOnly
}) => {
  const columnMetadata = dataMetadata?.column_metadata;
  const isTable = chartConfig?.selectedChartType === 'table';

  // Determine the card class name based on chart type and data fetch status
  const cardClassName = isTable || !fetchedData ? '' : 'p-4';

  return (
    <div
      className={cn('flex h-full flex-col overflow-hidden', cardClassName, className)}
      data-testid="metric-view-chart-content">
      <BusterChartDynamic
        loading={!fetchedData}
        error={errorMessage || undefined}
        data={metricData}
        columnMetadata={columnMetadata}
        id={METRIC_CHART_CONTAINER_ID(metricId)}
        readOnly={readOnly}
        {...chartConfig}
      />
    </div>
  );
};

MetricViewChartContent.displayName = 'MetricViewChartContent';
