import { BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';

export const metricsArrayToRecord = (metrics: BusterMetricListItem[]) => {
  return metrics.reduce(
    (acc, metric) => {
      acc[metric.id] = metric;
      return acc;
    },
    {} as Record<string, BusterMetricListItem>
  );
};

export const createFilterRecord = ({
  filters = [],
  admin_view
}: {
  filters?: VerificationStatus[];
  admin_view: boolean;
}): string => {
  const filtersString = filters.join(',');
  const adminViewString = admin_view ? 'admin_view' : '';
  return filtersString + adminViewString;
};
