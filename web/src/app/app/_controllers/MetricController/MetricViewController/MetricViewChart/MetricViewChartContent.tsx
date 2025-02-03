import type { DataMetadata } from '@/api/asset_interfaces';
import type { BusterMetricData, IBusterMetric } from '@/context/Metrics';
import { createStyles } from 'antd-style';
import React from 'react';

interface MetricViewChartContentProps {
  className?: string;
  chartConfig: IBusterMetric['chart_config'];
  metricData: BusterMetricData['data'];
  dataMetadata: DataMetadata;
  fetchedData: BusterMetricData['fetched'];
  errorMessage: string | null | undefined;
}

export const MetricViewChartContent: React.FC<MetricViewChartContentProps> = React.memo(
  ({ className, chartConfig, metricData, dataMetadata, fetchedData, errorMessage }) => {
    const { styles, cx } = useStyles();
    return <div className={cx('flex flex-col py-4', className)}>MetricViewChartContent</div>;
  }
);

MetricViewChartContent.displayName = 'MetricViewChartContent';

const useStyles = createStyles(({ css, token }) => ({}));
