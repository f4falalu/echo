import type { MetricChartProps } from '@buster/server-shared/metrics';
import type { BusterChartProps, BusterChartPropsBase } from '../BusterChart.types';
export interface BusterMetricChartProps extends MetricChartProps, BusterChartPropsBase {
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}
