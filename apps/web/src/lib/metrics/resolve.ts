import { DEFAULT_METRIC } from '@buster/server-shared/metrics';
import type { BusterMetric } from '@/api/asset_interfaces/metric';

export const resolveEmptyMetric = (
  metric: BusterMetric | undefined,
  metricId: string
): BusterMetric => {
  if (!metric || !metric?.id) {
    return { ...DEFAULT_METRIC, ...metric, id: metricId };
  }
  return metric;
};
