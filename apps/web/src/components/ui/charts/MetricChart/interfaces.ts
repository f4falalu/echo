import type { BusterChartProps, BusterChartPropsBase } from '@/api/asset_interfaces/metric/charts';
import { MetricChartProps } from '@buster/server-shared/metrics';
export interface BusterMetricChartProps extends MetricChartProps, BusterChartPropsBase {
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}
