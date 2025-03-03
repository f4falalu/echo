import {
  DEFAULT_COLUMN_SETTINGS,
  type ColumnMetaData,
  type IBusterMetricChartConfig
} from '@/api/asset_interfaces';
import type { ColumnSettings } from '@/components/ui/charts';

export const createDefaultColumnSettings = (
  existingColumnSettings: Record<string, ColumnSettings> | undefined,
  columnsMetaData: ColumnMetaData[] | undefined
): IBusterMetricChartConfig['columnSettings'] => {
  if (!columnsMetaData) return {};

  return columnsMetaData.reduce<IBusterMetricChartConfig['columnSettings']>((acc, column) => {
    acc[column.name] = {
      ...DEFAULT_COLUMN_SETTINGS,
      ...(existingColumnSettings?.[column.name] || {})
    };
    return acc;
  }, {});
};
