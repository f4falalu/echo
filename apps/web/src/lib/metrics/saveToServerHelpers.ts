import isEqual from 'lodash/isEqual';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import type { updateMetric } from '@/api/buster_rest/metrics';
import { getChangedValues } from '@/lib/objects';
import { createDefaultChartConfig } from './messageAutoChartHandler';
import {
  DEFAULT_COLUMN_SETTINGS,
  DEFAULT_COLUMN_LABEL_FORMAT,
  type ChartConfigProps,
  type BarAndLineAxis,
  type ScatterAxis,
  type PieChartAxis,
  type ComboChartAxis,
  type ColumnSettings,
  type ColumnLabelFormat,
  DEFAULT_CHART_CONFIG_ENTRIES,
  type DataMetadata
} from '@buster/server-shared/metrics';

const DEFAULT_COLUMN_SETTINGS_ENTRIES = Object.entries(DEFAULT_COLUMN_SETTINGS);
const DEFAULT_COLUMN_LABEL_FORMATS_ENTRIES = Object.entries(DEFAULT_COLUMN_LABEL_FORMAT);

export const getChangedTopLevelMessageValues = (
  newMetric: BusterMetric,
  oldMetric: BusterMetric
) => {
  const changes = getChangedValues(oldMetric, newMetric, ['name', 'status', 'sql', 'file']);
  return changes;
};

const keySpecificHandlers: Partial<Record<keyof ChartConfigProps, (value: unknown) => unknown>> = {
  barAndLineAxis: (value: unknown) => value as BarAndLineAxis,
  scatterAxis: (value: unknown) => value as ScatterAxis,
  pieChartAxis: (value: unknown) => value as PieChartAxis,
  comboChartAxis: (value: unknown) => value as ComboChartAxis,
  colors: (value: unknown) => value as string[],
  columnSettings: (columnSettings: unknown) => {
    const typedColumnSettings = columnSettings as ChartConfigProps['columnSettings'];
    // Early return if no column settings
    if (!typedColumnSettings) return {};

    const diff: Record<string, ColumnSettings> = {};

    // Single loop through column settings
    for (const [key, value] of Object.entries(typedColumnSettings)) {
      const changedSettings: Partial<ColumnSettings> = {};
      let hasChanges = false;

      // Check each default setting
      for (const [settingKey, defaultValue] of DEFAULT_COLUMN_SETTINGS_ENTRIES) {
        const columnSettingValue = value?.[settingKey as keyof ColumnSettings];
        if (!isEqual(defaultValue, columnSettingValue)) {
          (changedSettings as Record<string, unknown>)[settingKey] = columnSettingValue;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        diff[key] = changedSettings as ColumnSettings;
      }
    }

    return diff;
  },
  columnLabelFormats: (columnLabelFormats: unknown) => {
    const typedColumnLabelFormats = columnLabelFormats as Record<string, ColumnLabelFormat>;
    // Early return if no column settings
    if (!typedColumnLabelFormats) return {};

    const diff: Record<string, ColumnLabelFormat> = {};

    // Single loop through column label formats
    for (const [key, value] of Object.entries(typedColumnLabelFormats)) {
      const changedSettings: Partial<ColumnLabelFormat> = {};
      let hasChanges = false;

      // Check each default setting
      for (const [settingKey, defaultValue] of DEFAULT_COLUMN_LABEL_FORMATS_ENTRIES) {
        const columnSettingValue = value[settingKey as keyof ColumnLabelFormat];
        if (!isEqual(defaultValue, columnSettingValue)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this is a workaround to avoid type errors
          changedSettings[settingKey as keyof ColumnLabelFormat] = columnSettingValue as any;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        diff[key] = changedSettings as ColumnLabelFormat;
      }
    }

    return diff;
  }
};

export const getChangesFromDefaultChartConfig = (newMetric: BusterMetric) => {
  const chartConfig = newMetric.chart_config;
  if (!chartConfig) return {} as ChartConfigProps;

  const diff: Partial<ChartConfigProps> = {};

  for (const [_key, defaultValue] of DEFAULT_CHART_CONFIG_ENTRIES) {
    const key = _key as keyof ChartConfigProps;
    const chartConfigValue = chartConfig[key];
    const handler = keySpecificHandlers[key];

    if (handler) {
      const valueToUse = handler(chartConfigValue);
      if (valueToUse && Object.keys(valueToUse).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this is a workaround to avoid type errors
        diff[key] = valueToUse as any;
      }
      continue;
    }

    if (!isEqual(chartConfigValue, defaultValue)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this is a workaround to avoid type errors
      diff[key] = chartConfigValue as any;
    }
  }

  return diff as ChartConfigProps;
};

export const combineChangeFromDefaultChartConfig = (
  newMetric: BusterMetric,
  dataMetadata: DataMetadata
) => {
  const chartConfig = createDefaultChartConfig({
    chart_config: newMetric.chart_config,
    data_metadata: dataMetadata
  });
  return chartConfig;
};

export const prepareMetricUpdateMetric = (
  newMetric: BusterMetric,
  prevMetric: BusterMetric
): Parameters<typeof updateMetric>[0] | null => {
  const changedTopLevelValues = getChangedTopLevelMessageValues(
    newMetric,
    prevMetric
  ) as unknown as Parameters<typeof updateMetric>[0];
  const dataMetadata = prevMetric.data_metadata;

  const changedChartConfig = combineChangeFromDefaultChartConfig(newMetric, dataMetadata);

  return {
    ...changedTopLevelValues,
    chart_config: changedChartConfig,
    id: newMetric.id
  };
};
