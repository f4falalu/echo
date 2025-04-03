import type { ChartProps } from '../../core';
import { SeriesBuilderProps } from './interfaces';
import { LabelBuilderProps } from './useSeriesOptions';
import { formatChartLabelDelimiter, formatYAxisLabel, yAxisSimilar } from '../../../commonHelpers';
import { dataLabelFontColorContrast, formatBarAndLineDataLabel } from '../../helpers';
import { BarElement } from 'chart.js';
import { Context } from 'chartjs-plugin-datalabels';
import { defaultLabelOptionConfig } from '../useChartSpecificOptions/labelOptionConfig';
import type { Options } from 'chartjs-plugin-datalabels/types/options';
import { DEFAULT_CHART_LAYOUT } from '../../ChartJSTheme';
import { extractFieldsFromChain } from '../../../chartHooks';
import { IColumnLabelFormat } from '@/api/asset_interfaces/metric';

export const barSeriesBuilder = ({
  selectedDataset,
  allYAxisKeysIndexes,
  colors,
  columnSettings,
  columnLabelFormats,
  xAxisKeys,
  barShowTotalAtTop,
  allY2AxisKeysIndexes,
  ...rest
}: SeriesBuilderProps): ChartProps<'bar'>['data']['datasets'] => {
  const dataLabelOptions: Options['labels'] = {};

  if (barShowTotalAtTop && (allYAxisKeysIndexes.length > 1 || allY2AxisKeysIndexes?.length > 0)) {
    const yAxis = allYAxisKeysIndexes.map((yAxis) => {
      const key = extractFieldsFromChain(yAxis.name).at(-1)?.key!;
      return key;
    });

    let hasBeenDrawn = false;

    dataLabelOptions.stackTotal = {
      display: function (context) {
        const chart = context.chart;
        const shownDatasets = context.chart.data.datasets.filter(
          (dataset, index) =>
            !dataset.hidden &&
            !dataset.isTrendline &&
            //this means that it is hidden via the legend
            !chart.getDatasetMeta(index).hidden
        );
        const canDisplay = context.datasetIndex === shownDatasets.length - 1;
        if (canDisplay && !hasBeenDrawn) {
          const chartLayout = context.chart.options.layout;
          const padding = { ...DEFAULT_CHART_LAYOUT.padding, top: 24 };
          context.chart.options.layout = { ...chartLayout, padding };
          requestAnimationFrame(() => {
            context.chart.update(); //this is hack because the chart data label almost always overflows
          });
          hasBeenDrawn = true;
        }
        return canDisplay;
      },
      formatter: function (_, context) {
        const canUseSameYFormatter = yAxisSimilar(yAxis, columnLabelFormats);
        const value = context.chart.$totalizer.stackTotals[context.dataIndex];
        return formatYAxisLabel(
          value,
          yAxis,
          canUseSameYFormatter,
          columnLabelFormats,
          false,
          false
        );
      },
      anchor: 'end',
      align: 'end',
      clamp: true,
      clip: false,
      z: 1000,
      ...defaultLabelOptionConfig
    } as NonNullable<Options['labels']>['stackTotal'];
  }

  return allYAxisKeysIndexes.map<ChartProps<'bar'>['data']['datasets'][number]>(
    (yAxisItem, index) => {
      return barBuilder({
        selectedDataset,
        colors,
        columnSettings,
        columnLabelFormats,
        yAxisItem,
        index,
        xAxisKeys,
        dataLabelOptions
      });
    }
  );
};

declare module 'chart.js' {
  interface Chart {
    $barDataLabels: Record<number, Record<number, string>>;
    $barDataLabelsGlobalRotation: boolean;
    $barDataLabelsUpdateInProgress: boolean;
    $barDataLabelsLastRotationCheck?: number;
  }
}

const TEXT_WIDTH_BUFFER = 4;
const MAX_BAR_HEIGHT = 16;
const MAX_BAR_WIDTH = 13;
const FULL_ROTATION_ANGLE = -90;
const ROTATION_CHECK_THROTTLE = 225; // ms

export const barBuilder = ({
  selectedDataset,
  colors,
  columnSettings,
  columnLabelFormats,
  yAxisItem,
  index,
  yAxisID,
  order,
  xAxisKeys,
  dataLabelOptions
}: Pick<
  SeriesBuilderProps,
  'selectedDataset' | 'colors' | 'columnSettings' | 'columnLabelFormats'
> & {
  yAxisItem: SeriesBuilderProps['allYAxisKeysIndexes'][number];
  index: number;
  yAxisID?: string;
  order?: number;
  xAxisKeys: string[];
  dataLabelOptions?: Options['labels'];
}): ChartProps<'bar'>['data']['datasets'][number] => {
  const yKey = extractFieldsFromChain(yAxisItem.name).at(-1)?.key!;
  const columnSetting = columnSettings[yKey];
  const columnLabelFormat = columnLabelFormats[yKey];
  const usePercentage = !!columnSetting?.showDataLabelsAsPercentage;
  const showLabels = !!columnSetting?.showDataLabels;

  return {
    type: 'bar',
    label: yAxisItem.name,
    yAxisID: yAxisID || 'y',
    order,
    data: selectedDataset.source.map((item) => item[yAxisItem.index] as number),
    backgroundColor: colors[index % colors.length],
    borderRadius: (columnSetting?.barRoundness || 0) / 2,
    xAxisKeys,
    datalabels: {
      clamp: false,
      clip: false,
      labels: {
        barTotal: {
          display: (context) => {
            // Initialize the global rotation flag if it doesn't exist
            if (context.chart.$barDataLabelsGlobalRotation === undefined) {
              context.chart.$barDataLabelsGlobalRotation = false;
              context.chart.$barDataLabelsUpdateInProgress = false;
              context.chart.$barDataLabelsLastRotationCheck = 0;
            }

            // First dataset - analyze all data points to determine if any need rotation
            if (index === 0 && context.datasetIndex === 0) {
              throttledSetGlobalRotation(context);
            }

            const rawValue = context.dataset.data[context.dataIndex] as number;

            if (!showLabels || !rawValue) return false;

            const { barWidth, barHeight } = getBarDimensions(context);

            if (barWidth < MAX_BAR_WIDTH) return false;

            const formattedValue = getFormattedValue(context, {
              usePercentage,
              columnLabelFormat
            });

            // Get text width for this specific label
            const { width: textWidth } = context.chart.ctx.measureText(formattedValue);

            // Use the global rotation setting
            const rotation = context.chart.$barDataLabelsGlobalRotation ? FULL_ROTATION_ANGLE : 0;

            // Check if this label can be displayed even with rotation
            if (rotation === -90 && textWidth > barHeight - TEXT_WIDTH_BUFFER) {
              return false;
            }

            // Check if the bar height is too small to display the label
            if (barHeight < MAX_BAR_HEIGHT) return false;

            return 'auto';
          },
          formatter: (_, context) => {
            return context.chart.$barDataLabels?.[context.datasetIndex]?.[context.dataIndex] || '';
          },
          rotation: (context) => {
            // Always use the global rotation setting
            return context.chart.$barDataLabelsGlobalRotation ? FULL_ROTATION_ANGLE : 0;
          },
          color: dataLabelFontColorContrast,
          borderWidth: 0,
          padding: 1,
          borderRadius: 2.5,
          anchor: 'end',
          align: 'start',
          backgroundColor: ({ datasetIndex, chart }) => {
            const backgroundColor = chart.options.backgroundColor as string[];
            return backgroundColor[datasetIndex];
          }
        },
        ...dataLabelOptions
      }
    } as ChartProps<'bar'>['data']['datasets'][number]['datalabels']
  } as ChartProps<'bar'>['data']['datasets'][number];
};

const setBarDataLabelsManager = (context: Context, formattedValue: string) => {
  const dataIndex = context.dataIndex;
  const datasetIndex = context.datasetIndex;

  context.chart.$barDataLabels = {
    ...context.chart.$barDataLabels,
    [datasetIndex]: {
      ...context.chart.$barDataLabels?.[datasetIndex],
      [dataIndex]: formattedValue
    }
  };
};

const getBarDimensions = (context: Context) => {
  const barElement = context.chart.getDatasetMeta(context.datasetIndex).data[
    context.dataIndex
  ] as BarElement;

  const { width: barWidth, height: barHeight } = barElement.getProps(['width', 'height'], true);
  return { barWidth, barHeight };
};

const throttledSetGlobalRotation = (context: Context) => {
  const now = Date.now();
  // Skip if we checked recently or if update is in progress
  if (
    context.chart.$barDataLabelsUpdateInProgress ||
    (context.chart.$barDataLabelsLastRotationCheck &&
      now - context.chart.$barDataLabelsLastRotationCheck < ROTATION_CHECK_THROTTLE)
  ) {
    return;
  }

  // Mark that we're checking now
  context.chart.$barDataLabelsLastRotationCheck = now;
  context.chart.$barDataLabelsUpdateInProgress = true;

  // Use requestAnimationFrame to ensure we're not blocking the main thread
  requestAnimationFrame(() => {
    setGlobalRotation(context);
    // Mark that we're done updating
    context.chart.$barDataLabelsUpdateInProgress = false;
  });
};

const setGlobalRotation = (context: Context) => {
  context.chart.$barDataLabelsGlobalRotation = false;

  const labels = context.chart.data.datasets
    .filter((d) => !d.hidden)
    .flatMap((dataset, datasetIndex) => {
      return dataset.data.map((value, dataIndex) => {
        const currentValue = context.chart.$barDataLabels?.[datasetIndex]?.[dataIndex] || '';
        return currentValue || '';
      });
    });

  const labelNeedsToBeRotated = labels.some((label) => {
    const { width: textWidth } = context.chart.ctx.measureText(label);
    const { barWidth, barHeight } = getBarDimensions(context);
    return textWidth > barWidth - TEXT_WIDTH_BUFFER;
  });

  if (labelNeedsToBeRotated) {
    context.chart.$barDataLabelsGlobalRotation = true;
  }
};

const getFormattedValue = (
  context: Context,
  {
    usePercentage,
    columnLabelFormat
  }: {
    usePercentage: boolean;
    columnLabelFormat: IColumnLabelFormat;
  }
) => {
  const rawValue = context.dataset.data[context.dataIndex] as number;
  const currentValue =
    context.chart.$barDataLabels?.[context.datasetIndex]?.[context.dataIndex] || '';
  const formattedValue =
    currentValue || formatBarAndLineDataLabel(rawValue, context, usePercentage, columnLabelFormat);
  // Store only the formatted value, rotation is handled globally
  setBarDataLabelsManager(context, formattedValue);

  return formattedValue;
};

export const barSeriesBuilder_labels = (props: LabelBuilderProps) => {
  const { dataset, columnLabelFormats } = props;

  return dataset.source.map<string>((item) => {
    return formatChartLabelDelimiter(item[0] as string, columnLabelFormats);
  });
};
