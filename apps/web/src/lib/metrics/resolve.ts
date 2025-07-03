import { DEFAULT_IBUSTER_METRIC, type BusterMetric } from '@/api/asset_interfaces/metric';

export const resolveEmptyMetric = (
  metric: BusterMetric | undefined,
  metricId: string
): BusterMetric => {
  if (!metric || !metric?.id) {
    return { ...DEFAULT_IBUSTER_METRIC, ...metric, id: metricId };
  }
  return metric;
};
