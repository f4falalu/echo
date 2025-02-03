import { createDefaultChartConfig } from './messageAutoChartHandler';
import { IBusterMetric } from '../interfaces';
import { BusterMetric } from '@/api/asset_interfaces';

export const upgradeMetricToIMetric = (
  metric: BusterMetric,
  oldMetric: IBusterMetric | null | undefined
): IBusterMetric => {
  const chart_config = createDefaultChartConfig(metric);
  return {
    ...oldMetric,
    ...metric,
    chart_config
  };
};
