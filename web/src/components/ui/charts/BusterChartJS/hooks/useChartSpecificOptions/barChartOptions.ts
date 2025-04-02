import type { ChartProps } from '../../core';
import type { ChartType as ChartJSChartType } from 'chart.js';
import type { DeepPartial } from 'utility-types';
import type { PluginChartOptions } from 'chart.js';
import { ChartSpecificOptionsProps } from './interfaces';

export const barOptionsHandler = (
  props: ChartSpecificOptionsProps
): ChartProps<ChartJSChartType>['options'] => {
  return {};
};

export const barPluginsHandler = ({
  barShowTotalAtTop,
  barGroupType,
  columnLabelFormats,
  selectedAxis,
  columnSettings,
  data,
  ...rest
}: ChartSpecificOptionsProps): DeepPartial<PluginChartOptions<ChartJSChartType>>['plugins'] => {
  const hasShowLabelAsPercentage = Object.entries(columnSettings || {}).some(
    ([key, columnSetting]) => columnSetting.showDataLabelsAsPercentage
  );

  return {
    totalizer: {
      enabled: (barShowTotalAtTop && barGroupType === 'stack') || hasShowLabelAsPercentage
    },
    annotation: {
      annotations: barShowTotalAtTop ? undefined : undefined
    }
  };
};
