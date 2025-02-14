import type { BusterMetric, IBusterMetricChartConfig } from '@/api/asset_interfaces';

export interface IBusterMetric extends Required<BusterMetric> {
  chart_config: IBusterMetricChartConfig;
  fetched: boolean;
  fetching: boolean;
  fetchedAt: number;
}
