import type { DataMetadata } from '@/api/asset_interfaces';
import { BusterChart, ChartType } from '@/components/ui/charts';
import type { BusterMetricData } from '@/context/MetricData';
import type { IBusterMetric } from '@/context/Metrics';
import { createStyles } from 'antd-style';
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
    const { cx } = useStyles();
    const columnMetadata = dataMetadata?.column_metadata;
    const isTable = chartConfig?.selectedChartType === ChartType.Table;

    const cardClassName = useMemo(() => {
      if (isTable || !fetchedData) return '';
      return 'p-4';
    }, [isTable, fetchedData]);

    return (
      <div className={cx('flex h-full flex-col overflow-hidden', cardClassName, className)}>
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

const useStyles = createStyles(({ css, token }) => ({}));
