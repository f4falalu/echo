import type { BusterMetric, BusterMetric } from '@/api/asset_interfaces/metric';
import { createDefaultChartConfig } from './messageAutoChartHandler';

export const upgradeMetricToIMetric = (
  metric: BusterMetric,
  oldMetric: BusterMetric | null | undefined
): BusterMetric => {
  const chart_config = createDefaultChartConfig(metric);
  return {
    ...oldMetric,
    ...metric,
    chart_config
  };
};
