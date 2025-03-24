import {
  DEFAULT_CHART_CONFIG_ENTRIES,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
  type IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';
import { getChangedValues } from '@/lib/objects';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import isEqual from 'lodash/isEqual';
import type {
  BarAndLineAxis,
  BusterChartConfigProps,
  ColumnLabelFormat,
  ColumnSettings,
  ComboChartAxis,
  PieChartAxis,
  ScatterAxis
} from '@/api/asset_interfaces/metric/charts';
import { type updateMetric } from '@/api/buster_rest/metrics';

const DEFAULT_COLUMN_SETTINGS_ENTRIES = Object.entries(DEFAULT_COLUMN_SETTINGS);
const DEFAULT_COLUMN_LABEL_FORMATS_ENTRIES = Object.entries(DEFAULT_COLUMN_LABEL_FORMAT);

const getChangedTopLevelMessageValues = (newMetric: IBusterMetric, oldMetric: IBusterMetric) => {
  return getChangedValues(oldMetric, newMetric, ['name', 'feedback', 'status', 'sql', 'file']);
};

const keySpecificHandlers: Partial<Record<keyof IBusterMetricChartConfig, (value: any) => any>> = {
  barAndLineAxis: (value: BarAndLineAxis) => value,
  scatterAxis: (value: ScatterAxis) => value,
  pieChartAxis: (value: PieChartAxis) => value,
  comboChartAxis: (value: ComboChartAxis) => value,
  columnSettings: (columnSettings: BusterChartConfigProps['columnSettings']) => {
    // Early return if no column settings
    if (!columnSettings) return {};

    const diff: Record<string, ColumnSettings> = {};

    // Single loop through column settings
    for (const [key, value] of Object.entries(columnSettings)) {
      const changedSettings: ColumnSettings = {};
      let hasChanges = false;

      // Check each default setting
      for (const [settingKey, defaultValue] of DEFAULT_COLUMN_SETTINGS_ENTRIES) {
        const columnSettingValue = value[settingKey as keyof ColumnSettings];
        if (!isEqual(defaultValue, columnSettingValue)) {
          //@ts-ignore
          changedSettings[settingKey as keyof ColumnSettings] = columnSettingValue as any;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        diff[key] = changedSettings;
      }
    }

    return diff;
  },
  columnLabelFormats: (columnLabelFormats: Record<string, ColumnLabelFormat>) => {
    // Early return if no column settings
    if (!columnLabelFormats) return {};

    const diff: Record<string, ColumnLabelFormat> = {};

    // Single loop through column label formats
    for (const [key, value] of Object.entries(columnLabelFormats)) {
      const changedSettings: ColumnLabelFormat = {};
      let hasChanges = false;

      // Check each default setting
      for (const [settingKey, defaultValue] of DEFAULT_COLUMN_LABEL_FORMATS_ENTRIES) {
        const columnSettingValue = value[settingKey as keyof ColumnLabelFormat];
        if (!isEqual(defaultValue, columnSettingValue)) {
          //@ts-ignore
          changedSettings[settingKey as keyof ColumnLabelFormat] = columnSettingValue;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        diff[key] = changedSettings;
      }
    }

    return diff;
  }
};

const getChangesFromDefaultChartConfig = (newMetric: IBusterMetric) => {
  const chartConfig = newMetric.chart_config;
  if (!chartConfig) return {} as BusterChartConfigProps;

  const diff: Partial<IBusterMetricChartConfig> = {};

  for (const [_key, defaultValue] of DEFAULT_CHART_CONFIG_ENTRIES) {
    const key = _key as keyof IBusterMetricChartConfig;
    const chartConfigValue = chartConfig[key];
    const handler = keySpecificHandlers[key];

    if (handler) {
      const valueToUse = handler(chartConfigValue);
      if (valueToUse && Object.keys(valueToUse).length > 0) {
        //@ts-ignore
        diff[key] = valueToUse;
      }
      continue;
    }

    if (!isEqual(chartConfigValue, defaultValue)) {
      //@ts-ignore
      diff[key] = chartConfigValue as any;
    }
  }

  return diff as BusterChartConfigProps;
};

export const prepareMetricUpdateMetric = (
  newMetric: IBusterMetric,
  oldMetric: IBusterMetric
): Parameters<typeof updateMetric>[0] | null => {
  const changedTopLevelValues = getChangedTopLevelMessageValues(
    newMetric,
    oldMetric
  ) as unknown as Parameters<typeof updateMetric>[0];

  const changedChartConfig = getChangesFromDefaultChartConfig(newMetric);

  return {
    ...changedTopLevelValues,
    chart_config: changedChartConfig,
    id: newMetric.id
  };
};
