import { DashboardConfig } from '@/api/asset_interfaces/dashboard';
import { BusterMetric } from '@/api/asset_interfaces/metric';
import { BusterResizeableGridRow } from '@/components/ui/grid/interfaces';

export const hasUnmappedMetrics = (
  metrics: Record<string, BusterMetric>,
  configRows: DashboardConfig['rows'] = []
) => {
  return !Object.values(metrics).every((m) =>
    configRows.some((r) => r.items.some((t) => t.id === m.id))
  );
};

export const hasRemovedMetrics = (
  metrics: Record<string, BusterMetric>,
  configRows: BusterResizeableGridRow[]
) => {
  const allGridItemsLength = configRows.flatMap((r) => r.items).length;

  if (allGridItemsLength !== Object.values(metrics).length) {
    return true;
  }

  return !configRows.every((r) =>
    r.items.some((t) => Object.values(metrics).some((m) => t.id === m.id))
  );
};
