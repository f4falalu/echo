import { createDefaultChartConfig } from './messageAutoChartHandler';
import type { IBusterMetric, BusterMetric } from '@/api/asset_interfaces/metric';

export const upgradeMetricToIMetric = (
  metric: BusterMetric,
  oldMetric: IBusterMetric | null | undefined
): IBusterMetric => {
  const chart_config = createDefaultChartConfig(metric);
  return {
    ...oldMetric,
    ...metric,
    chart_config,
    fetched: true,
    fetching: false,
    fetchedAt: Date.now()
  };
};
