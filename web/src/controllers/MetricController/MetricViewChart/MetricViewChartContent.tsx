import type { BusterMetricData, DataMetadata, IBusterMetric } from '@/api/asset_interfaces/metric';
import { BusterChart, ChartType } from '@/components/ui/charts';
import { cn } from '@/lib/classMerge';
import React, { useMemo } from 'react';

interface MetricViewChartContentProps {
  className?: string;
  chartConfig: IBusterMetric['chart_config'];
  metricData: BusterMetricData['data'];
  dataMetadata: DataMetadata | undefined;
  fetchedData: boolean;
  errorMessage: string | null | undefined;
}

export const MetricViewChartContent: React.FC<MetricViewChartContentProps> = React.memo(
  ({ className, chartConfig, metricData = null, dataMetadata, fetchedData, errorMessage }) => {
    const columnMetadata = dataMetadata?.column_metadata;
    const isTable = chartConfig?.selectedChartType === ChartType.Table;

    const cardClassName = useMemo(() => {
      if (isTable || !fetchedData) return '';
      return 'p-4';
    }, [isTable, fetchedData]);

    return (
      <div className={cn('flex h-full flex-col overflow-hidden', cardClassName, className)}>
        <BusterChart
          loading={!fetchedData}
          error={errorMessage || undefined}
          data={metricData}
          columnMetadata={columnMetadata}
          {...chartConfig}
        />
      </div>
    );
  }
);

MetricViewChartContent.displayName = 'MetricViewChartContent';
